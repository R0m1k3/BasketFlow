const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const THESPORTSDB_PAGE = 'https://www.thesportsdb.com/league/4546-euroleague-basketball';

const TEAM_NAME_MAPPING = {
  'Real Madr': 'REAL MADRID',
  'Real Madrid': 'REAL MADRID',
  'KK Partiz': 'PARTIZAN MOZZART BET BELGRADE',
  'Partizan': 'PARTIZAN MOZZART BET BELGRADE',
  'Paris Bas': 'PARIS BASKETBALL',
  'Paris Basketball': 'PARIS BASKETBALL',
  'Baskonia': 'BASKONIA VITORIA-GASTEIZ',
  'Virtus Pa': 'VIRTUS BOLOGNA',
  'Virtus Bologna': 'VIRTUS BOLOGNA',
  'AS Monaco': 'AS MONACO',
  'Valencia': 'VALENCIA BASKET',
  'Valencia Basket': 'VALENCIA BASKET',
  'Hapoel Te': 'HAPOEL IBI TEL AVIV',
  'Hapoel Tel Aviv': 'HAPOEL IBI TEL AVIV',
  'Panathina': 'PANATHINAIKOS AKTOR ATHENS',
  'Panathinaikos': 'PANATHINAIKOS AKTOR ATHENS',
  'Lyon-Vill': 'LDLC ASVEL VILLEURBANNE',
  'ASVEL': 'LDLC ASVEL VILLEURBANNE',
  'Bayern M': 'FC BAYERN MUNICH',
  'Bayern Munich': 'FC BAYERN MUNICH',
  'Olimpia M': 'EA7 EMPORIO ARMANI MILAN',
  'Olimpia Milano': 'EA7 EMPORIO ARMANI MILAN',
  'Olympiaco': 'OLYMPIACOS PIRAEUS',
  'Olympiacos': 'OLYMPIACOS PIRAEUS',
  'Anadolu E': 'ANADOLU EFES ISTANBUL',
  'Anadolu Efes': 'ANADOLU EFES ISTANBUL',
  'Maccabi T': 'MACCABI RAPYD TEL AVIV',
  'Maccabi Tel Aviv': 'MACCABI RAPYD TEL AVIV',
  'FC Barcel': 'FC BARCELONA',
  'FC Barcelona': 'FC BARCELONA',
  'KK Crvena': 'CRVENA ZVEZDA MERIDIANBET BELGRADE',
  'Crvena Zvezda': 'CRVENA ZVEZDA MERIDIANBET BELGRADE',
  'BC Žalgi': 'ZALGIRIS KAUNAS',
  'Zalgiris': 'ZALGIRIS KAUNAS',
  'Fenerbah': 'FENERBAHCE BEKO ISTANBUL',
  'Fenerbahce': 'FENERBAHCE BEKO ISTANBUL',
  'Dubai Bas': 'DUBAI BASKETBALL',
  'Dubai Basketball': 'DUBAI BASKETBALL'
};

async function fetchEuroleagueResults(geminiApiKey) {
  console.log('  🏀 Fetching ALL Euroleague matches from TheSportsDB via Gemini...');
  
  if (!geminiApiKey) {
    console.log('  ⚠️  No Gemini API key - skipping Euroleague');
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

TÂCHE : Extraire TOUS les matchs (résultats passés + matchs à venir) depuis DEUX sections :
1. Section "Results" → matchs TERMINÉS avec SCORES
2. Section "Upcoming" → matchs À VENIR sans scores

INSTRUCTIONS CRITIQUES - SECTION "Results" :
- Cherche la section "Results" dans le HTML
- Extrais **MINIMUM 15 MATCHS TERMINÉS** avec leurs SCORES RÉELS (ne t'arrête pas à 10 !)
- PARCOURS TOUTE la section Results jusqu'au bout
- Il peut y avoir 15, 20, 25+ matchs - EXTRAIS-LES TOUS
- Format: homeTeam, awayTeam, homeScore, awayScore, date, time, status: "finished"
- L'équipe à GAUCHE (premier score) est homeTeam, l'équipe à DROITE (second score) est awayTeam
- IMPORTANT: Ne limite PAS à 10 résultats, continue jusqu'à la fin de la section

INSTRUCTIONS CRITIQUES - SECTION "Upcoming" :
- Cherche la section "Upcoming" dans le HTML  
- Extrais **MINIMUM 15 MATCHS À VENIR** SANS scores (ne t'arrête pas à 10 !)
- PARCOURS TOUTE la section Upcoming jusqu'au bout
- Il peut y avoir 15, 20, 25+ matchs - EXTRAIS-LES TOUS
- homeScore: null, awayScore: null, status: "scheduled"
- IMPORTANT: Ne limite PAS à 10 matchs, continue jusqu'à la fin de la section

FORMAT DE RÉPONSE (JSON OBLIGATOIRE) :
{
  "results": [
    {
      "homeTeam": "Real Madrid",
      "awayTeam": "Partizan",
      "homeScore": 93,
      "awayScore": 86,
      "date": "2025-10-15",
      "time": "20:00",
      "status": "finished"
    }
  ],
  "upcoming": [
    {
      "homeTeam": "Barcelona",
      "awayTeam": "Bayern Munich",
      "homeScore": null,
      "awayScore": null,
      "date": "2025-10-20",
      "time": "20:45",
      "status": "scheduled"
    }
  ]
}

RÈGLES STRICTES :
- Année : TOUJOURS utilise ${currentYear} pour l'année
- Format date OBLIGATOIRE : "YYYY-MM-DD" (exemple: "2025-10-23", JAMAIS "23 octobre")
- SI TU NE TROUVES PAS une section → renvoie array vide []
- SCORES OBLIGATOIRES pour results, null pour upcoming
- DATES COMPLÈTES : Toujours année-mois-jour, jamais juste jour/mois

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
    const upcoming = extractedData.upcoming || [];
    const allMatches = [...results, ...upcoming];
    
    console.log(`  ✨ Gemini extracted ${results.length} results + ${upcoming.length} upcoming = ${allMatches.length} total matches`);

    if (allMatches.length === 0) {
      console.log('  ℹ️  No matches found');
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
    let createdCount = 0;

    for (const matchData of allMatches) {
      try {
        if (!matchData.homeTeam || !matchData.awayTeam) {
          console.log(`     ⚠️  Skipped match: missing team names`);
          continue;
        }

        const findTeam = async (teamName) => {
          const mappedName = TEAM_NAME_MAPPING[teamName] || teamName;
          
          const team = await prisma.team.findFirst({
            where: { name: mappedName }
          });
          
          return team;
        };
        
        let homeTeam = await findTeam(matchData.homeTeam);
        let awayTeam = await findTeam(matchData.awayTeam);

        // Créer les équipes si elles n'existent pas
        if (!homeTeam) {
          const mappedName = TEAM_NAME_MAPPING[matchData.homeTeam] || matchData.homeTeam;
          homeTeam = await prisma.team.create({
            data: { name: mappedName, logo: null }
          });
        }
        if (!awayTeam) {
          const mappedName = TEAM_NAME_MAPPING[matchData.awayTeam] || matchData.awayTeam;
          awayTeam = await prisma.team.create({
            data: { name: mappedName, logo: null }
          });
        }

        const timeStr = matchData.time || '20:00';
        const dateTime = new Date(`${matchData.date}T${timeStr}:00`);
        if (isNaN(dateTime.getTime())) {
          console.log(`     ⚠️  Skipped match ${matchData.homeTeam} vs ${matchData.awayTeam}: invalid date ${matchData.date}`);
          continue;
        }

        const externalId = `euroleague-${homeTeam.name}-${awayTeam.name}-${matchData.date}`.replace(/\s+/g, '-').toLowerCase();

        const existingMatch = await prisma.match.findFirst({
          where: {
            OR: [
              { externalId: externalId },
              {
                homeTeamId: homeTeam.id,
                awayTeamId: awayTeam.id,
                leagueId: league.id,
                dateTime: {
                  gte: new Date(dateTime.getTime() - 24 * 60 * 60 * 1000),
                  lte: new Date(dateTime.getTime() + 24 * 60 * 60 * 1000)
                }
              }
            ]
          }
        });

        // Déterminer le statut : si scores présents = finished, sinon scheduled
        const hasScores = matchData.homeScore !== null && matchData.awayScore !== null;
        const status = hasScores ? 'finished' : 'scheduled';

        if (existingMatch) {
          await prisma.match.update({
            where: { id: existingMatch.id },
            data: {
              homeScore: matchData.homeScore,
              awayScore: matchData.awayScore,
              status: status,
              dateTime: dateTime
            }
          });
          updatedCount++;
          if (matchData.homeScore !== null) {
            console.log(`     ✅ Updated: ${matchData.homeTeam.substring(0,10)} ${matchData.homeScore}-${matchData.awayScore} ${matchData.awayTeam.substring(0,10)}`);
          }
        } else {
          await prisma.match.create({
            data: {
              externalId,
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              leagueId: league.id,
              dateTime: dateTime,
              homeScore: matchData.homeScore,
              awayScore: matchData.awayScore,
              status: status
            }
          });
          createdCount++;
          if (matchData.homeScore !== null) {
            console.log(`     ✅ Created: ${matchData.homeTeam.substring(0,10)} ${matchData.homeScore}-${matchData.awayScore} ${matchData.awayTeam.substring(0,10)}`);
          }
        }
        
      } catch (err) {
        console.log(`     ⚠️  Error processing match ${matchData.homeTeam} vs ${matchData.awayTeam}:`, err.message);
      }
    }

    console.log(`  ✅ Euroleague: Created ${createdCount} matches, Updated ${updatedCount} matches (total ${createdCount + updatedCount})`);
    return createdCount + updatedCount;

  } catch (error) {
    console.error('  ❌ Euroleague results error:', error.message);
    return 0;
  }
}

module.exports = {
  fetchEuroleagueResults
};
