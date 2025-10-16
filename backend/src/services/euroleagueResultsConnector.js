const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const THESPORTSDB_PAGE = 'https://www.thesportsdb.com/league/4546-euroleague-basketball';

async function fetchEuroleagueResults(geminiApiKey) {
  console.log('  🏀 Fetching Euroleague results from TheSportsDB via Gemini...');
  
  if (!geminiApiKey) {
    console.log('  ⚠️  No Gemini API key - skipping Euroleague results');
    return 0;
  }

  try {
    const response = await axios.get(THESPORTSDB_PAGE, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });

    const html = response.data;
    console.log(`  📄 Retrieved HTML page (${Math.round(html.length / 1024)}KB)`);

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const currentYear = new Date().getFullYear();
    
    const prompt = `Tu es un expert en extraction de données HTML pour le basketball européen.

Voici le code HTML de la page TheSportsDB pour l'EuroLeague :

${html}

TÂCHE : Extraire UNIQUEMENT les résultats récents depuis la section "Results" avec les SCORES.

INSTRUCTIONS CRITIQUES :
- Cherche la section "Results" dans le HTML
- Extrais les matchs TERMINÉS avec leurs SCORES RÉELS
- Format: homeTeam, awayTeam, homeScore, awayScore, date
- L'équipe à GAUCHE (premier score) est homeTeam, l'équipe à DROITE (second score) est awayTeam
- N'INVENTE RIEN - extrais UNIQUEMENT ce qui est visible

FORMAT DE RÉPONSE (JSON OBLIGATOIRE) :
{
  "results": [
    {
      "homeTeam": "Real Madrid",
      "awayTeam": "Partizan",
      "homeScore": 93,
      "awayScore": 86,
      "date": "2025-10-15",
      "status": "finished"
    }
  ]
}

RÈGLES :
- Année : utilise ${currentYear} si non affichée
- SI TU NE TROUVES PAS la section Results → renvoie results: []
- SCORES OBLIGATOIRES pour tous les résultats

Réponds UNIQUEMENT avec le JSON ci-dessus, sans texte avant ou après.`;

    const result = await model.generateContent(prompt);
    const geminiResponse = result.response.text();
    
    let jsonText = geminiResponse.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    jsonText = jsonText.trim();

    const extractedData = JSON.parse(jsonText);
    const results = extractedData.results || [];
    
    console.log(`  ✨ Gemini extracted ${results.length} Euroleague results with scores`);

    if (results.length === 0) {
      console.log('  ℹ️  No results found');
      return 0;
    }

    const league = await prisma.league.findFirst({
      where: { name: 'Euroleague' }
    });

    if (!league) {
      console.log('  ⚠️  Euroleague league not found in database');
      return 0;
    }

    let updatedCount = 0;

    for (const matchData of results) {
      try {
        if (!matchData.homeTeam || !matchData.awayTeam || matchData.homeScore === undefined || matchData.awayScore === undefined) {
          continue;
        }

        const allTeams = await prisma.team.findMany();
        
        const findBestMatch = (searchName) => {
          const normalized = searchName.toLowerCase().trim();
          
          for (const team of allTeams) {
            const teamNameLower = team.name.toLowerCase();
            
            if (teamNameLower.includes(normalized) || normalized.includes(teamNameLower)) {
              return team;
            }
            
            const teamWords = teamNameLower.split(/\s+/);
            const searchWords = normalized.split(/\s+/);
            
            let matchCount = 0;
            for (const word of searchWords) {
              if (word.length > 2 && teamWords.some(tw => tw.includes(word) || word.includes(tw))) {
                matchCount++;
              }
            }
            
            if (matchCount >= Math.min(2, searchWords.length)) {
              return team;
            }
          }
          
          return null;
        };
        
        const homeTeam = findBestMatch(matchData.homeTeam);
        const awayTeam = findBestMatch(matchData.awayTeam);

        if (!homeTeam || !awayTeam) {
          console.log(`     ⚠️  Teams not found: ${matchData.homeTeam} vs ${matchData.awayTeam}`);
          continue;
        }

        const dateTime = new Date(`${matchData.date}T20:00:00`);
        if (isNaN(dateTime.getTime())) {
          continue;
        }

        const existingMatch = await prisma.match.findFirst({
          where: {
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: league.id,
            dateTime: {
              gte: new Date(dateTime.getTime() - 24 * 60 * 60 * 1000),
              lte: new Date(dateTime.getTime() + 24 * 60 * 60 * 1000)
            }
          }
        });

        if (existingMatch) {
          await prisma.match.update({
            where: { id: existingMatch.id },
            data: {
              homeScore: matchData.homeScore,
              awayScore: matchData.awayScore,
              status: 'finished'
            }
          });
          updatedCount++;
          console.log(`     ✅ Updated: ${matchData.homeTeam} ${matchData.homeScore}-${matchData.awayScore} ${matchData.awayTeam}`);
        }
        
      } catch (err) {
        console.log(`     ⚠️  Error processing result:`, err.message);
      }
    }

    console.log(`  ✅ Euroleague: Updated ${updatedCount} matches with scores`);
    return updatedCount;

  } catch (error) {
    console.error('  ❌ Euroleague results error:', error.message);
    return 0;
  }
}

module.exports = {
  fetchEuroleagueResults
};
