const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const RAPIDAPI_HOST = 'basketball-api1.p.rapidapi.com';
const RAPIDAPI_BASE_URL = `https://${RAPIDAPI_HOST}/api/basketball`;

// Tournament IDs for Basketball API1
const TOURNAMENT_IDS = {
  NBA: 132,              // NBA
  WNBA: 146,             // WNBA
  EUROLEAGUE: 138,       // Euroleague
  EUROCUP: 325,          // EuroCup
  BETCLIC_ELITE: 149,    // France - Betclic Elite
  BCL: 390               // Basketball Champions League
};

// Broadcaster mapping for French channels
const BROADCASTER_MAP = {
  'NBA': ['beIN Sports', 'Prime Video'],
  'WNBA': ['beIN Sports'],
  'EUROLEAGUE': ['SKWEEK', 'La Chaîne L\'Équipe'],
  'EUROCUP': ['SKWEEK'],
  'BETCLIC_ELITE': ['beIN Sports', 'La Chaîne L\'Équipe', 'DAZN'],
  'BCL': ['Courtside 1891']
};

async function fetchRapidApiGames(rapidApiKey) {
  console.log('  🏀 Fetching games from RapidAPI Basketball API1...');
  
  if (!rapidApiKey) {
    console.log('  ⚠️  RapidAPI Basketball key not configured');
    return 0;
  }
  
  try {
    const today = new Date();
    const fromDate = formatDate(today);
    
    const endDate = new Date();
    endDate.setDate(today.getDate() + 21);
    const toDate = formatDate(endDate);
    
    let totalMatches = 0;
    
    // Fetch games for each tournament over 21 days
    for (const [leagueName, tournamentId] of Object.entries(TOURNAMENT_IDS)) {
      try {
        console.log(`  📡 Fetching ${leagueName}...`);
        
        // Iterate through all 21 days
        for (let dayOffset = 0; dayOffset <= 21; dayOffset++) {
          const currentDate = new Date(today);
          currentDate.setDate(today.getDate() + dayOffset);
          const dateStr = formatDate(currentDate);
          
          try {
            const response = await axios.get(`${RAPIDAPI_BASE_URL}/matches/date/${dateStr}`, {
              params: {
                tournament: tournamentId
              },
              headers: {
                'X-RapidAPI-Key': rapidApiKey,
                'X-RapidAPI-Host': RAPIDAPI_HOST
              },
              timeout: 15000
            });
            
            const events = response.data?.events || [];
            
            for (const event of events) {
              const eventDate = new Date(event.startTimestamp * 1000);
              // Only save events within the 21-day window
              if (eventDate >= today && eventDate <= endDate) {
                await saveRapidApiGame(event, leagueName);
                totalMatches++;
              }
            }
          } catch (dateError) {
            // Skip this date if no games or error (404 is normal for days with no games)
            if (dateError.response?.status !== 404) {
              console.error(`     ⚠️  Error on ${dateStr}:`, dateError.message);
            }
          }
        }
        
        console.log(`     ✓ ${leagueName} complete`);
      } catch (error) {
        console.error(`     ❌ Error fetching ${leagueName}:`, error.message);
      }
    }
    
    console.log(`  ✅ RapidAPI Basketball: Saved ${totalMatches} matches across all leagues`);
    return totalMatches;
    
  } catch (error) {
    console.error('  ❌ RapidAPI Basketball error:', error.message);
    return 0;
  }
}

async function saveRapidApiGame(event, leagueName) {
  try {
    const externalId = `rapidapi-${event.id}`;
    
    const mappedLeague = mapLeagueName(leagueName);
    const homeTeamName = event.homeTeam?.name || 'Unknown';
    const awayTeamName = event.awayTeam?.name || 'Unknown';
    const gameDateTime = new Date(event.startTimestamp * 1000);
    
    // Create or get league
    const league = await prisma.league.upsert({
      where: { name: mappedLeague },
      update: {},
      create: {
        name: mappedLeague,
        shortName: getLeagueShortName(mappedLeague),
        country: getLeagueCountry(mappedLeague),
        logo: null
      }
    });
    
    // Create or get home team
    let homeTeam = await prisma.team.findFirst({
      where: { name: homeTeamName }
    });
    
    if (!homeTeam) {
      homeTeam = await prisma.team.create({
        data: {
          name: homeTeamName,
          logo: event.homeTeam?.logo || null
        }
      });
    }
    
    // Create or get away team
    let awayTeam = await prisma.team.findFirst({
      where: { name: awayTeamName }
    });
    
    if (!awayTeam) {
      awayTeam = await prisma.team.create({
        data: {
          name: awayTeamName,
          logo: event.awayTeam?.logo || null
        }
      });
    }
    
    // Check if match exists
    const existingMatch = await prisma.match.findUnique({
      where: { externalId }
    });
    
    // Determine status
    const status = event.status?.type === 'finished' ? 'finished' : 
                   event.status?.type === 'inprogress' ? 'live' : 'scheduled';
    
    // Save or update match
    if (existingMatch) {
      await prisma.match.update({
        where: { id: existingMatch.id },
        data: {
          dateTime: gameDateTime,
          status,
          homeScore: event.homeScore?.current || null,
          awayScore: event.awayScore?.current || null
        }
      });
    } else {
      const match = await prisma.match.create({
        data: {
          externalId,
          dateTime: gameDateTime,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          leagueId: league.id,
          status,
          homeScore: event.homeScore?.current || null,
          awayScore: event.awayScore?.current || null
        }
      });
      
      // Add broadcasters
      await addBroadcasters(match.id, leagueName);
    }
  } catch (error) {
    console.error(`    ⚠️  Error saving RapidAPI game:`, error.message);
  }
}

async function addBroadcasters(matchId, leagueName) {
  const broadcasterNames = BROADCASTER_MAP[leagueName] || [];
  
  for (const broadcasterName of broadcasterNames) {
    let broadcaster = await prisma.broadcaster.findFirst({
      where: { name: broadcasterName }
    });
    
    if (!broadcaster) {
      broadcaster = await prisma.broadcaster.create({
        data: {
          name: broadcasterName,
          logo: null,
          website: null
        }
      });
    }
    
    // Check if broadcast link already exists
    const existingBroadcast = await prisma.matchBroadcast.findFirst({
      where: {
        matchId: matchId,
        broadcasterId: broadcaster.id
      }
    });
    
    if (!existingBroadcast) {
      await prisma.matchBroadcast.create({
        data: {
          matchId: matchId,
          broadcasterId: broadcaster.id,
          isFree: broadcasterName === 'La Chaîne L\'Équipe' // Only L'Équipe is free
        }
      });
    }
  }
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function mapLeagueName(apiLeagueName) {
  const map = {
    'NBA': 'NBA',
    'WNBA': 'WNBA',
    'EUROLEAGUE': 'Euroleague',
    'EUROCUP': 'EuroCup',
    'BETCLIC_ELITE': 'Betclic Elite',
    'BCL': 'BCL'
  };
  return map[apiLeagueName] || apiLeagueName;
}

function getLeagueShortName(leagueName) {
  const map = {
    'NBA': 'NBA',
    'WNBA': 'WNBA',
    'Euroleague': 'EL',
    'EuroCup': 'EC',
    'Betclic Elite': 'BE',
    'BCL': 'BCL'
  };
  return map[leagueName] || leagueName.substring(0, 3).toUpperCase();
}

function getLeagueCountry(leagueName) {
  const map = {
    'NBA': 'USA',
    'WNBA': 'USA',
    'Euroleague': 'Europe',
    'EuroCup': 'Europe',
    'Betclic Elite': 'France',
    'BCL': 'Europe'
  };
  return map[leagueName] || 'International';
}

module.exports = {
  fetchRapidApiGames
};
