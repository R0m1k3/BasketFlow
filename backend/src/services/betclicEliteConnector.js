const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const THESPORTSDB_PAGE = 'https://www.thesportsdb.com/league/4423-french-lnb';

const BROADCASTERS = [
  { name: 'beIN Sports', type: 'cable', isFree: false },
  { name: 'La Chaîne L\'Équipe', type: 'cable', isFree: true },
  { name: 'DAZN', type: 'streaming', isFree: false }
];

async function fetchBetclicEliteSchedule(geminiApiKey) {
  console.log('  🏀 Fetching Betclic Elite schedule via Gemini HTML extraction...');
  
  if (!geminiApiKey) {
    console.log('  ⚠️  No Gemini API key - skipping Betclic Elite');
    return 0;
  }

  try {
    // Fetch HTML from TheSportsDB page
    const response = await axios.get(THESPORTSDB_PAGE, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });

    const html = response.data;
    console.log(`  📄 Retrieved HTML page (${Math.round(html.length / 1024)}KB)`);

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `Tu es un expert en extraction de données HTML pour le basketball français.

Voici le code HTML de la page TheSportsDB pour la ligue Betclic Elite (LNB Pro A) :

${html}

TÂCHE : Extraire UNIQUEMENT les matchs de basketball Betclic Elite qui sont affichés sur cette page.

INSTRUCTIONS CRITIQUES :
- N'INVENTE AUCUNE donnée, extrais SEULEMENT ce qui est présent dans le HTML
- Cherche les prochains matchs (Next Events) ET les résultats récents (Last Results)
- Pour chaque match, extrais : équipe domicile, équipe extérieure, date, heure, scores (si terminé)
- Format de date : YYYY-MM-DD
- Si le match est terminé, inclus homeScore et awayScore
- Si le match est à venir, mets homeScore: null, awayScore: null

Réponds UNIQUEMENT avec un JSON array valide, sans texte avant ou après :
[
  {
    "homeTeam": "nom équipe domicile",
    "awayTeam": "nom équipe extérieure", 
    "date": "YYYY-MM-DD",
    "time": "HH:MM",
    "homeScore": null ou nombre,
    "awayScore": null ou nombre,
    "status": "scheduled" ou "finished"
  }
]

Si aucun match n'est trouvé, réponds avec : []`;

    const result = await model.generateContent(prompt);
    const geminiResponse = result.response.text();
    
    // Clean and parse JSON response
    let jsonText = geminiResponse.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    jsonText = jsonText.trim();

    const extractedMatches = JSON.parse(jsonText);
    console.log(`  ✨ Gemini extracted ${extractedMatches.length} Betclic Elite matches`);

    if (extractedMatches.length === 0) {
      console.log('  ℹ️  No matches found on page');
      return 0;
    }

    // Create league
    const league = await prisma.league.upsert({
      where: { name: 'Betclic Elite' },
      update: {},
      create: {
        name: 'Betclic Elite',
        shortName: 'BET',
        country: 'France',
        logo: null
      }
    });

    // Create broadcasters
    const broadcasters = await Promise.all(
      BROADCASTERS.map(b =>
        prisma.broadcaster.upsert({
          where: { name: b.name },
          update: {},
          create: b
        })
      )
    );

    let savedCount = 0;

    for (const matchData of extractedMatches) {
      try {
        if (!matchData.homeTeam || !matchData.awayTeam || !matchData.date) {
          console.log(`     ⚠️  Skipping invalid match data`);
          continue;
        }

        // Create or get teams
        let homeTeam = await prisma.team.findFirst({
          where: { name: matchData.homeTeam }
        });
        if (!homeTeam) {
          homeTeam = await prisma.team.create({
            data: { name: matchData.homeTeam, logo: null }
          });
        }

        let awayTeam = await prisma.team.findFirst({
          where: { name: matchData.awayTeam }
        });
        if (!awayTeam) {
          awayTeam = await prisma.team.create({
            data: { name: matchData.awayTeam, logo: null }
          });
        }

        // Parse datetime
        const dateTime = new Date(`${matchData.date}T${matchData.time || '20:00'}:00`);
        if (isNaN(dateTime.getTime())) {
          console.log(`     ⚠️  Invalid date for match: ${matchData.homeTeam} vs ${matchData.awayTeam}`);
          continue;
        }

        const externalId = `betclic-${matchData.homeTeam.replace(/\s+/g, '-')}-vs-${matchData.awayTeam.replace(/\s+/g, '-')}-${matchData.date}`;

        const match = await prisma.match.upsert({
          where: { externalId },
          update: {
            dateTime,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: league.id,
            status: matchData.status || 'scheduled',
            homeScore: matchData.homeScore,
            awayScore: matchData.awayScore
          },
          create: {
            externalId,
            dateTime,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: league.id,
            status: matchData.status || 'scheduled',
            homeScore: matchData.homeScore,
            awayScore: matchData.awayScore
          }
        });

        // Delete old broadcasts
        await prisma.matchBroadcast.deleteMany({
          where: { matchId: match.id }
        });

        // Add broadcasters (beIN Sports primary)
        const mainBroadcaster = broadcasters.find(b => b.name === 'beIN Sports');
        if (mainBroadcaster) {
          await prisma.matchBroadcast.create({
            data: {
              matchId: match.id,
              broadcasterId: mainBroadcaster.id
            }
          });
        }

        savedCount++;
      } catch (err) {
        console.log(`     ⚠️  Error saving match: ${err.message}`);
      }
    }

    console.log(`  ✅ Betclic Elite: Saved ${savedCount} authentic matches from web extraction`);
    return savedCount;

  } catch (error) {
    console.error('  ❌ Betclic Elite extraction error:', error.message);
    return 0;
  }
}

async function cleanOldBetclicMatches() {
  try {
    const result = await prisma.match.deleteMany({
      where: {
        externalId: {
          startsWith: 'betclic-'
        }
      }
    });
    console.log(`🧹 Cleaned ${result.count} old Betclic Elite matches`);
  } catch (error) {
    console.log('⚠️  Error cleaning old matches:', error.message);
  }
}

module.exports = {
  fetchBetclicEliteSchedule,
  cleanOldBetclicMatches
};
