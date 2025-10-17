const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');
const { getTeamLogo, getBroadcasterLogo } = require('../utils/logoMapping');
const prisma = new PrismaClient();

const THESPORTSDB_PAGE = 'https://www.thesportsdb.com/league/4423-french-lnb';

function getBroadcasters() {
  return [
    { name: 'beIN Sports', type: 'cable', isFree: false, logo: getBroadcasterLogo('beIN Sports') },
    { name: 'La Chaîne L\'Équipe', type: 'cable', isFree: true, logo: getBroadcasterLogo('La Chaîne L\'Équipe') },
    { name: 'DAZN', type: 'streaming', isFree: false, logo: getBroadcasterLogo('DAZN') }
  ];
}

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

    // Get current year for date parsing
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12
    
    const prompt = `Tu es un expert en extraction de données HTML pour le basketball français.

Voici le code HTML de la page TheSportsDB pour la ligue Betclic Elite (LNB Pro A) :

${html}

TÂCHE : Extraire les matchs depuis DEUX sections DISTINCTES et les retourner dans un objet JSON avec 2 arrays séparés :
1. Section "Results" → résultats passés AVEC SCORES OBLIGATOIRES
2. Section "Upcoming" → matchs à venir SANS scores (null)

INSTRUCTIONS CRITIQUES - SECTION "Results" :
- Cherche la section HTML intitulée "Results" (en dessous de "Upcoming")
- Extrais TOUS les matchs avec leurs SCORES RÉELS (exemple: "Paris Bas 94 - 99 AS Monaco")
- Format: homeTeam, awayTeam, date, SCORES (homeScore et awayScore OBLIGATOIRES), status: "finished"
- L'équipe à GAUCHE (premier score) est homeTeam, l'équipe à DROITE (second score) est awayTeam

INSTRUCTIONS CRITIQUES - SECTION "Upcoming" :
- Cherche la section HTML intitulée "Upcoming" (en haut de page)
- Extrais les matchs à venir SANS scores
- homeScore: null, awayScore: null, status: "scheduled"

FORMAT DE RÉPONSE (JSON OBLIGATOIRE) :
{
  "results": [
    {
      "homeTeam": "Paris Bas",
      "awayTeam": "AS Monaco",
      "date": "2025-10-12",
      "time": "20:00",
      "homeScore": 94,
      "awayScore": 99,
      "status": "finished"
    }
  ],
  "upcoming": [
    {
      "homeTeam": "Saint-Que",
      "awayTeam": "Graveline",
      "date": "2025-10-17",
      "time": "18:30",
      "homeScore": null,
      "awayScore": null,
      "status": "scheduled"
    }
  ]
}

RÈGLES :
- ANNÉE : Si non affichée, utilise ${currentYear}. Si mois < ${currentMonth}, utilise ${currentYear + 1}
- SI TU NE TROUVES PAS la section Results → renvoie results: []
- SI TU NE TROUVES PAS la section Upcoming → renvoie upcoming: []
- N'INVENTE RIEN, extrais UNIQUEMENT les données visibles dans le HTML

Réponds UNIQUEMENT avec le JSON ci-dessus, sans texte avant ou après.`;

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

    const extractedData = JSON.parse(jsonText);
    const results = extractedData.results || [];
    const upcoming = extractedData.upcoming || [];
    const allMatches = [...results, ...upcoming];
    
    console.log(`  ✨ Gemini extracted ${results.length} past results + ${upcoming.length} upcoming = ${allMatches.length} total matches`);

    if (allMatches.length === 0) {
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
      getBroadcasters().map(b =>
        prisma.broadcaster.upsert({
          where: { name: b.name },
          update: {},
          create: b
        })
      )
    );

    let savedCount = 0;

    for (const matchData of allMatches) {
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
            data: { name: matchData.homeTeam, logo: getTeamLogo(matchData.homeTeam) }
          });
        }

        let awayTeam = await prisma.team.findFirst({
          where: { name: matchData.awayTeam }
        });
        if (!awayTeam) {
          awayTeam = await prisma.team.create({
            data: { name: matchData.awayTeam, logo: getTeamLogo(matchData.awayTeam) }
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
