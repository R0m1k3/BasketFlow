const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASKETAPI1_KEY = process.env.BASKETAPI1_KEY;
const BASKETAPI1_HOST = 'api-basketball.p.rapidapi.com';

const LEAGUE_IDS = {
  NBA: 12,
  WNBA: 16,
  EUROLEAGUE: 120,
  EUROCUP: 121,
  BETCLIC_ELITE: 117
};

const BROADCASTER_MAPPING = {
  NBA: ['beIN Sports', 'Prime Video', 'NBA League Pass'],
  WNBA: ['NBA League Pass', 'beIN Sports'],
  EUROLEAGUE: ['SKWEEK', 'La Chaîne L\'Équipe', 'EuroLeague TV'],
  EUROCUP: ['SKWEEK', 'EuroLeague TV'],
  BETCLIC_ELITE: ['beIN Sports', 'La Chaîne L\'Équipe', 'DAZN']
};

async function fetchGames(leagueId, season = '2024-2025') {
  if (!BASKETAPI1_KEY) {
    console.log('⚠️  BASKETAPI1_KEY not configured, skipping...');
    return [];
  }

  try {
    const response = await axios.get('https://api-basketball.p.rapidapi.com/games', {
      params: { league: leagueId, season },
      headers: {
        'X-RapidAPI-Key': BASKETAPI1_KEY,
        'X-RapidAPI-Host': BASKETAPI1_HOST
      }
    });

    return response.data.response || [];
  } catch (error) {
    console.error(`❌ BasketAPI1 error for league ${leagueId}:`, error.message);
    return [];
  }
}

async function updateMatches() {
  console.log('\n🏀 Starting BasketAPI1 update...');
  
  let totalCreated = 0;
  let totalUpdated = 0;

  for (const [leagueName, leagueId] of Object.entries(LEAGUE_IDS)) {
    console.log(`\n📊 Fetching ${leagueName} matches...`);
    
    const games = await fetchGames(leagueId);
    console.log(`   Found ${games.length} games for ${leagueName}`);

    for (const game of games) {
      try {
        const league = await prisma.league.upsert({
          where: { name: leagueName },
          update: {},
          create: {
            name: leagueName,
            shortName: leagueName,
            country: leagueName === 'NBA' || leagueName === 'WNBA' ? 'USA' : 
                     leagueName === 'BETCLIC_ELITE' ? 'France' : 'Europe',
            color: getLeagueColor(leagueName)
          }
        });

        const homeTeam = await prisma.team.upsert({
          where: { 
            name_leagueId: { 
              name: game.teams.home.name, 
              leagueId: league.id 
            } 
          },
          update: {},
          create: {
            name: game.teams.home.name,
            shortName: game.teams.home.code || game.teams.home.name.substring(0, 3).toUpperCase(),
            logo: game.teams.home.logo || null,
            leagueId: league.id
          }
        });

        const awayTeam = await prisma.team.upsert({
          where: { 
            name_leagueId: { 
              name: game.teams.away.name, 
              leagueId: league.id 
            } 
          },
          update: {},
          create: {
            name: game.teams.away.name,
            shortName: game.teams.away.code || game.teams.away.name.substring(0, 3).toUpperCase(),
            logo: game.teams.away.logo || null,
            leagueId: league.id
          }
        });

        const matchDate = new Date(game.date);
        const externalId = `basketapi1-${leagueId}-${game.id}`;

        const status = game.status.short === 'FT' ? 'finished' : 
                      game.status.short === 'LIVE' ? 'live' : 'scheduled';

        const existingMatch = await prisma.match.findUnique({
          where: { externalId }
        });

        if (existingMatch) {
          await prisma.match.update({
            where: { externalId },
            data: {
              status,
              homeScore: game.scores?.home?.total || null,
              awayScore: game.scores?.away?.total || null
            }
          });
          totalUpdated++;
        } else {
          const match = await prisma.match.create({
            data: {
              leagueId: league.id,
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              dateTime: matchDate,
              venue: game.venue || null,
              status,
              homeScore: game.scores?.home?.total || null,
              awayScore: game.scores?.away?.total || null,
              externalId
            }
          });

          const broadcasters = BROADCASTER_MAPPING[leagueName] || [];
          for (const broadcasterName of broadcasters) {
            const broadcaster = await prisma.broadcaster.upsert({
              where: { name: broadcasterName },
              update: {},
              create: {
                name: broadcasterName,
                type: 'TV',
                isFree: broadcasterName.includes('Équipe')
              }
            });

            await prisma.broadcast.create({
              data: {
                matchId: match.id,
                broadcasterId: broadcaster.id
              }
            });
          }

          totalCreated++;
        }
      } catch (error) {
        console.error(`   ❌ Error processing game ${game.id}:`, error.message);
      }
    }
  }

  console.log(`\n✅ BasketAPI1 update complete: ${totalCreated} created, ${totalUpdated} updated`);
  return { created: totalCreated, updated: totalUpdated };
}

function getLeagueColor(leagueName) {
  const colors = {
    NBA: '#1D428A',
    WNBA: '#C8102E',
    EUROLEAGUE: '#FF7900',
    EUROCUP: '#009CDE',
    BETCLIC_ELITE: '#002654'
  };
  return colors[leagueName] || '#333';
}

module.exports = { updateMatches };
