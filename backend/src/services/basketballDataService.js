// Basketball Data API (BroadageSports) integration for live scores and match data
// API: https://rapidapi.com/BroadageSports/api/basketball-data
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Tournament IDs for Basketball Data API
const TOURNAMENT_IDS = {
  NBA: 132,           // NBA
  WNBA: 218,          // WNBA
  Euroleague: 138,    // Euroleague
  EuroCup: 203,       // EuroCup
  'Betclic Elite': 85, // French LNB Pro A
  BCL: 175            // Basketball Champions League
};

const LEAGUE_MAPPING = {
  132: 'NBA',
  218: 'WNBA',
  138: 'Euroleague',
  203: 'EuroCup',
  85: 'Betclic Elite',
  175: 'BCL'
};

/**
 * Fetch matches from Basketball Data API
 * @param {string} apiKey - RapidAPI key for Basketball Data
 * @returns {Promise<number>} Number of matches saved
 */
async function fetchAndSave(apiKey) {
  if (!apiKey) {
    console.log('  ⚠️  No Basketball Data API key configured');
    return 0;
  }

  try {
    console.log('  🏀 Fetching matches from Basketball Data API...');
    
    // Get today and next 14 days
    const today = new Date();
    const dateFrom = formatDate(today);
    const dateTo = formatDate(new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000));

    let totalSaved = 0;

    // Fetch matches for each tournament
    for (const [leagueName, tournamentId] of Object.entries(TOURNAMENT_IDS)) {
      try {
        const matches = await fetchTournamentMatches(apiKey, tournamentId, dateFrom, dateTo);
        const saved = await saveMatches(matches, leagueName);
        totalSaved += saved;
        console.log(`  ✅ ${leagueName}: ${saved} matches saved`);
      } catch (error) {
        console.error(`  ❌ Error fetching ${leagueName}:`, error.message);
      }
    }

    console.log(`  📊 Total matches saved from Basketball Data: ${totalSaved}`);
    return totalSaved;
  } catch (error) {
    console.error('  ❌ Basketball Data API error:', error.message);
    return 0;
  }
}

/**
 * Fetch matches for a specific tournament
 */
async function fetchTournamentMatches(apiKey, tournamentId, dateFrom, dateTo) {
  const url = 'https://basketball-data.p.rapidapi.com/match/list-by-date';
  
  const response = await axios.get(url, {
    params: {
      tournament: tournamentId,
      dateFrom,
      dateTo
    },
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'basketball-data.p.rapidapi.com'
    },
    timeout: 10000
  });

  return response.data?.matches || [];
}

/**
 * Save matches to database
 */
async function saveMatches(matches, leagueName) {
  if (!matches || matches.length === 0) return 0;

  let savedCount = 0;

  for (const match of matches) {
    try {
      // Parse match data
      const matchDate = new Date(match.startTimestamp * 1000); // Convert Unix timestamp
      
      // Get or create league
      const league = await prisma.league.upsert({
        where: { name: leagueName },
        update: {},
        create: {
          name: leagueName,
          shortName: getShortName(leagueName),
          country: getCountry(leagueName),
          color: getLeagueColor(leagueName)
        }
      });

      // Get or create home team
      let homeTeam = await prisma.team.findFirst({
        where: { name: match.homeTeam?.name }
      });
      
      if (!homeTeam && match.homeTeam?.name) {
        homeTeam = await prisma.team.create({
          data: {
            name: match.homeTeam.name,
            shortName: match.homeTeam.shortName || null,
            logo: null // Will be enriched by Gemini
          }
        });
      }

      // Get or create away team
      let awayTeam = await prisma.team.findFirst({
        where: { name: match.awayTeam?.name }
      });
      
      if (!awayTeam && match.awayTeam?.name) {
        awayTeam = await prisma.team.create({
          data: {
            name: match.awayTeam.name,
            shortName: match.awayTeam.shortName || null,
            logo: null // Will be enriched by Gemini
          }
        });
      }

      if (!homeTeam || !awayTeam) {
        console.log(`  ⚠️  Skipping match - missing team data`);
        continue;
      }

      // Create unique external ID with basketballdata prefix
      const externalId = `basketballdata-${match.id}`;

      // Check if match already exists
      const existingMatch = await prisma.match.findUnique({
        where: { externalId }
      });

      // Determine status and scores
      let status = 'scheduled';
      let homeScore = null;
      let awayScore = null;

      if (match.status?.type === 'finished') {
        status = 'finished';
        homeScore = match.homeScore?.current;
        awayScore = match.awayScore?.current;
      } else if (match.status?.type === 'inprogress') {
        status = 'live';
        homeScore = match.homeScore?.current;
        awayScore = match.awayScore?.current;
      }

      if (existingMatch) {
        // Update existing match with latest scores
        await prisma.match.update({
          where: { id: existingMatch.id },
          data: {
            status,
            homeScore,
            awayScore,
            dateTime: matchDate
          }
        });
        console.log(`  🔄 Updated: ${match.homeTeam.name} vs ${match.awayTeam.name} (${status})`);
      } else {
        // Create new match
        await prisma.match.create({
          data: {
            externalId,
            dateTime: matchDate,
            homeTeamId: homeTeam.id,
            awayTeamId: awayTeam.id,
            leagueId: league.id,
            status,
            homeScore,
            awayScore
          }
        });
        savedCount++;
      }
    } catch (error) {
      console.error(`  ⚠️  Error saving match:`, error.message);
    }
  }

  return savedCount;
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

module.exports = { fetchAndSave };
