// Gemini AI with Google Search to find and generate scheduled basketball matches
const { GoogleGenAI } = require('@google/genai');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Use Gemini with Google Search to find scheduled basketball matches
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<number>} Number of matches created
 */
async function fetchAndGenerateMatches(apiKey) {
  if (!apiKey) {
    console.log('  ⚠️  No Gemini API key configured');
    return 0;
  }

  try {
    console.log('  🤖 Using Gemini AI to find scheduled basketball matches...');
    
    const ai = new GoogleGenAI({ apiKey });

    // Get date range for next 14 days
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 14);
    
    const dateFrom = formatDate(today);
    const dateTo = formatDate(endDate);

    const prompt = `Recherche sur Google les calendriers officiels de basketball et trouve les matchs programmés du ${dateFrom} au ${dateTo} pour :
- NBA (NBA.com)
- WNBA (WNBA.com)
- Euroleague (Euroleague.net)
- EuroCup (Eurocupbasketball.com)
- Betclic Elite (LNB.fr)
- BCL (championsleague.basketball)

Retourne un tableau JSON avec ce format exact pour chaque match :
{
  "league": "NBA",
  "homeTeam": "Boston Celtics", 
  "awayTeam": "Miami Heat",
  "dateTime": "2025-10-17T19:30:00Z",
  "broadcaster": "beIN Sports"
}

broadcaster = diffuseur français (beIN Sports, Prime Video, SKWEEK, La Chaîne L'Équipe, DAZN) ou "Non diffusé"`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        tools: [{
          googleSearch: {}
        }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              league: { type: 'string' },
              homeTeam: { type: 'string' },
              awayTeam: { type: 'string' },
              dateTime: { type: 'string' },
              broadcaster: { type: 'string' }
            },
            required: ['league', 'homeTeam', 'awayTeam', 'dateTime', 'broadcaster']
          }
        }
      }
    });
    
    const response = result.text;
    
    // Extract JSON from response
    let matchesData = [];
    try {
      // Try to find JSON in the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        matchesData = JSON.parse(jsonMatch[0]);
      } else {
        // Try parsing the whole response
        matchesData = JSON.parse(response);
      }
    } catch (parseError) {
      console.log('  ⚠️  Could not parse Gemini response as JSON');
      console.log('  Response:', response.substring(0, 500));
      return 0;
    }

    if (!Array.isArray(matchesData) || matchesData.length === 0) {
      console.log('  ⚠️  No matches found in Gemini response');
      return 0;
    }

    console.log(`  ✅ Gemini found ${matchesData.length} scheduled matches`);
    
    // Save matches to database
    let savedCount = 0;
    for (const matchData of matchesData) {
      try {
        console.log(`  → Saving: ${matchData.homeTeam} vs ${matchData.awayTeam} | Broadcaster: ${matchData.broadcaster || 'none'}`);
        await saveMatch(matchData);
        savedCount++;
      } catch (error) {
        console.log(`  ⚠️  Error saving match:`, error.message);
      }
    }

    console.log(`  📊 Saved ${savedCount} matches from Gemini`);
    return savedCount;

  } catch (error) {
    console.error('  ❌ Gemini error:', error.message);
    return 0;
  }
}

/**
 * Save a match to database
 */
async function saveMatch(matchData) {
  const { league, homeTeam, awayTeam, dateTime, broadcaster } = matchData;

  // Validate required fields
  if (!league || !homeTeam || !awayTeam || !dateTime) {
    throw new Error('Missing required match data');
  }

  // Get or create league
  const leagueRecord = await prisma.league.upsert({
    where: { name: league },
    update: {},
    create: {
      name: league,
      shortName: getShortName(league),
      country: getCountry(league),
      color: getLeagueColor(league)
    }
  });

  // Get or create home team
  let homeTeamRecord = await prisma.team.findFirst({
    where: { name: homeTeam }
  });
  
  if (!homeTeamRecord) {
    homeTeamRecord = await prisma.team.create({
      data: {
        name: homeTeam,
        shortName: null,
        logo: null
      }
    });
  }

  // Get or create away team
  let awayTeamRecord = await prisma.team.findFirst({
    where: { name: awayTeam }
  });
  
  if (!awayTeamRecord) {
    awayTeamRecord = await prisma.team.create({
      data: {
        name: awayTeam,
        shortName: null,
        logo: null
      }
    });
  }

  // Create unique external ID
  const matchDate = new Date(dateTime);
  const externalId = `gemini-${league}-${homeTeam}-${awayTeam}-${matchDate.getTime()}`.replace(/\s+/g, '-').toLowerCase();

  // Check if match already exists
  const existingMatch = await prisma.match.findUnique({
    where: { externalId }
  });

  let match;
  
  if (existingMatch) {
    // Update existing match
    await prisma.match.update({
      where: { id: existingMatch.id },
      data: {
        dateTime: matchDate
      }
    });
    match = existingMatch;
  } else {
    // Create new match
    match = await prisma.match.create({
      data: {
        externalId,
        dateTime: matchDate,
        homeTeamId: homeTeamRecord.id,
        awayTeamId: awayTeamRecord.id,
        leagueId: leagueRecord.id,
        status: 'scheduled',
        homeScore: null,
        awayScore: null
      }
    });
  }

  // Add broadcaster if specified (for both new and existing matches)
  if (broadcaster && broadcaster !== 'Non diffusé') {
    const broadcasterRecord = await prisma.broadcaster.upsert({
      where: { name: broadcaster },
      update: {},
      create: {
        name: broadcaster,
        type: 'TV',
        logo: null,
        isFree: broadcaster.includes('gratuit') || broadcaster.includes("L'Équipe") || broadcaster.includes('Monaco')
      }
    });

    // Check if broadcast link already exists
    const existingBroadcast = await prisma.matchBroadcast.findUnique({
      where: {
        matchId_broadcasterId: {
          matchId: match.id,
          broadcasterId: broadcasterRecord.id
        }
      }
    });

    if (!existingBroadcast) {
      await prisma.matchBroadcast.create({
        data: {
          matchId: match.id,
          broadcasterId: broadcasterRecord.id
        }
      });
    }
  }
}

/**
 * Helper functions
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getShortName(leagueName) {
  const shortNames = {
    'NBA': 'NBA',
    'WNBA': 'WNBA',
    'Euroleague': 'EL',
    'EuroCup': 'EC',
    'Betclic Elite': 'LNB',
    'BCL': 'BCL'
  };
  return shortNames[leagueName] || leagueName.substring(0, 3).toUpperCase();
}

function getCountry(leagueName) {
  const countries = {
    'NBA': 'USA',
    'WNBA': 'USA',
    'Euroleague': 'Europe',
    'EuroCup': 'Europe',
    'Betclic Elite': 'France',
    'BCL': 'Europe'
  };
  return countries[leagueName] || 'International';
}

function getLeagueColor(leagueName) {
  const colors = {
    'NBA': '#1D428A',
    'WNBA': '#C8102E',
    'Euroleague': '#FF7900',
    'EuroCup': '#009CDE',
    'Betclic Elite': '#002654',
    'BCL': '#000000'
  };
  return colors[leagueName] || '#333333';
}

module.exports = { fetchAndGenerateMatches };
