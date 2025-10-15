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

    const prompt = `Tu es un expert en basketball. Recherche sur Google les calendriers officiels et trouve TOUS les matchs programmés des ligues suivantes du ${dateFrom} au ${dateTo} :

1. **NBA** (États-Unis) - Recherche sur NBA.com ou ESPN
2. **WNBA** (États-Unis) - Recherche sur WNBA.com  
3. **Euroleague** (Europe) - Recherche sur Euroleague.net
4. **EuroCup** (Europe) - Recherche sur Eurocupbasketball.com
5. **Betclic Elite / LNB** (France) - Recherche sur LNB.fr ou Betclic Elite
6. **Basketball Champions League (BCL)** (Europe) - Recherche sur championsleague.basketball

Pour chaque match trouvé, retourne EXACTEMENT ce format JSON (pas de texte avant/après, SEULEMENT le JSON) :

\`\`\`json
[
  {
    "league": "NBA",
    "homeTeam": "Boston Celtics",
    "awayTeam": "Miami Heat",
    "dateTime": "2025-10-17T19:30:00Z",
    "broadcaster": "beIN Sports"
  }
]
\`\`\`

**IMPORTANT** :
- Format ISO 8601 pour dateTime (avec timezone)
- Noms d'équipes EXACTS (pas d'abréviations)
- broadcaster = chaîne française qui diffuse (beIN Sports, Prime Video, SKWEEK, La Chaîne L'Équipe, DAZN, NBA League Pass, ou "Non diffusé" si inconnu)
- Trouve TOUS les matchs programmés, pas seulement quelques-uns
- Vérifie les calendriers officiels sur Google

Retourne UNIQUEMENT le tableau JSON, rien d'autre.`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        tools: [{
          googleSearch: {}
        }]
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

  if (existingMatch) {
    // Update existing match
    await prisma.match.update({
      where: { id: existingMatch.id },
      data: {
        dateTime: matchDate
      }
    });
  } else {
    // Create new match
    const match = await prisma.match.create({
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

    // Add broadcaster if specified
    if (broadcaster && broadcaster !== 'Non diffusé') {
      const broadcasterRecord = await prisma.broadcaster.upsert({
        where: { name: broadcaster },
        update: {},
        create: {
          name: broadcaster,
          logo: null,
          subscriptionRequired: !broadcaster.includes('gratuit')
        }
      });

      await prisma.broadcast.create({
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
