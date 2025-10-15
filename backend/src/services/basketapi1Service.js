// BasketAPI1 integration for basketball live scores and match data
// API: https://rapidapi.com/fluis.lacasse/api/basketapi1
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Fetch matches from BasketAPI1
 * @param {string} apiKey - RapidAPI key for BasketAPI1
 * @returns {Promise<number>} Number of matches saved
 */
async function fetchAndSave(apiKey) {
  if (!apiKey) {
    console.log('  ⚠️  No BasketAPI1 API key configured');
    return 0;
  }

  try {
    console.log('  🏀 Fetching matches from BasketAPI1...');
    
    // Get today and next 14 days
    const today = new Date();
    const dates = [];
    
    // Generate array of dates for next 14 days
    for (let i = 0; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(formatDate(date));
    }

    let totalSaved = 0;

    // Fetch matches for each date
    for (const date of dates) {
      try {
        const matches = await fetchMatchesByDate(apiKey, date);
        const saved = await saveMatches(matches);
        totalSaved += saved;
        
        if (saved > 0) {
          console.log(`  ✅ ${date}: ${saved} matches saved`);
        }
      } catch (error) {
        console.error(`  ❌ Error fetching ${date}:`, error.message);
      }
    }

    console.log(`  📊 Total matches saved from BasketAPI1: ${totalSaved}`);
    return totalSaved;
  } catch (error) {
    console.error('  ❌ BasketAPI1 error:', error.message);
    return 0;
  }
}

/**
 * Fetch matches for a specific date
 */
async function fetchMatchesByDate(apiKey, date) {
  const url = `https://basketapi1.p.rapidapi.com/api/basketball/matches/${date}`;
  
  const response = await axios.get(url, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'basketapi1.p.rapidapi.com'
    },
    timeout: 10000
  });

  return response.data?.events || [];
}

/**
 * Save matches to database
 */
async function saveMatches(matches) {
  if (!matches || matches.length === 0) return 0;

  let savedCount = 0;

  for (const match of matches) {
    try {
      // Skip if no tournament info
      if (!match.tournament) continue;

      // Map tournament to our league names
      const leagueName = mapTournamentToLeague(match.tournament);
      if (!leagueName) continue; // Skip leagues we don't track

      // Parse match data
      const matchDate = new Date(match.startTimestamp * 1000);
      
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
            logo: null
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
            logo: null
          }
        });
      }

      if (!homeTeam || !awayTeam) continue;

      // Create unique external ID
      const externalId = `basketapi1-${match.id}`;

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
        // Update existing match
        await prisma.match.update({
          where: { id: existingMatch.id },
          data: {
            status,
            homeScore,
            awayScore,
            dateTime: matchDate
          }
        });
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
 * Map tournament name to our league names
 */
function mapTournamentToLeague(tournament) {
  const tournamentName = tournament.name?.toLowerCase() || '';
  const categoryName = tournament.category?.name?.toLowerCase() || '';
  
  // NBA
  if (tournamentName.includes('nba') || categoryName.includes('nba')) {
    return 'NBA';
  }
  
  // WNBA
  if (tournamentName.includes('wnba') || categoryName.includes('wnba')) {
    return 'WNBA';
  }
  
  // Euroleague
  if (tournamentName.includes('euroleague') || tournamentName.includes('euro league')) {
    return 'Euroleague';
  }
  
  // EuroCup
  if (tournamentName.includes('eurocup') || tournamentName.includes('euro cup')) {
    return 'EuroCup';
  }
  
  // Betclic Elite (France LNB)
  if (tournamentName.includes('betclic') || tournamentName.includes('lnb') || 
      (categoryName.includes('france') && tournamentName.includes('pro'))) {
    return 'Betclic Elite';
  }
  
  // BCL (Basketball Champions League)
  if (tournamentName.includes('champions league') || tournamentName.includes('bcl')) {
    return 'BCL';
  }
  
  return null; // Skip other tournaments
}

/**
 * Helper functions
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`; // Format: YYYYMMDD
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
