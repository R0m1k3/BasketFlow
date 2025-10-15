const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EUROLEAGUE_BASE_URL = 'https://api-live.euroleague.net/v1';
const EUROCUP_BASE_URL = 'https://api-live.euroleague.net/v1';

const BROADCASTER_MAPPING = {
  Euroleague: [
    { name: 'SKWEEK', isFree: false },
    { name: "La Chaîne L'Équipe", isFree: true },
    { name: 'TV Monaco', isFree: true },
    { name: 'EuroLeague TV', isFree: false }
  ],
  EuroCup: [
    { name: 'SKWEEK', isFree: false },
    { name: 'EuroLeague TV', isFree: false }
  ]
};

const LEAGUE_CONFIGS = {
  Euroleague: {
    name: 'Euroleague',
    shortName: 'EL',
    country: 'Europe',
    color: '#FF6B35',
    baseUrl: EUROLEAGUE_BASE_URL,
    seasonCode: 'E2025'
  },
  EuroCup: {
    name: 'EuroCup',
    shortName: 'EC',
    country: 'Europe',
    color: '#0066CC',
    baseUrl: EUROCUP_BASE_URL,
    seasonCode: 'U2025'
  }
};

async function fetchGamesForLeague(leagueName) {
  const leagueConfig = LEAGUE_CONFIGS[leagueName];
  
  try {
    const response = await axios.get(`${leagueConfig.baseUrl}/schedules`, {
      params: {
        seasonCode: leagueConfig.seasonCode
      },
      timeout: 10000
    });

    if (response.data && response.data.data) {
      const games = response.data.data;
      console.log(`  📊 ${leagueName} API: Found ${games.length} scheduled games`);
      return games;
    }
    return [];
  } catch (error) {
    console.error(`  ❌ ${leagueName} API error:`, error.message);
    return [];
  }
}

async function saveMatches(games, leagueName) {
  const leagueConfig = LEAGUE_CONFIGS[leagueName];
  
  const league = await prisma.league.upsert({
    where: { name: leagueConfig.name },
    update: {},
    create: {
      name: leagueConfig.name,
      shortName: leagueConfig.shortName,
      country: leagueConfig.country,
      color: leagueConfig.color
    }
  });

  let savedCount = 0;

  for (const game of games) {
    try {
      const homeTeamId = `${leagueName.toLowerCase()}-${game.home?.code || game.home?.name}`;
      const awayTeamId = `${leagueName.toLowerCase()}-${game.away?.code || game.away?.name}`;
      
      const homeTeam = await prisma.team.upsert({
        where: { id: homeTeamId },
        update: { name: game.home?.name },
        create: {
          id: homeTeamId,
          name: game.home?.name,
          shortName: game.home?.code || game.home?.name?.substring(0, 3).toUpperCase(),
          leagueId: league.id
        }
      });

      const awayTeam = await prisma.team.upsert({
        where: { id: awayTeamId },
        update: { name: game.away?.name },
        create: {
          id: awayTeamId,
          name: game.away?.name,
          shortName: game.away?.code || game.away?.name?.substring(0, 3).toUpperCase(),
          leagueId: league.id
        }
      });

      const externalId = `${leagueName.toLowerCase()}-${game.gamecode || game.id}`;
      const match = await prisma.match.upsert({
        where: { externalId },
        update: {
          dateTime: new Date(game.date),
          status: game.status || 'Scheduled'
        },
        create: {
          externalId,
          leagueId: league.id,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          dateTime: new Date(game.date),
          venue: game.venue || null,
          status: game.status || 'Scheduled'
        }
      });

      const broadcasters = BROADCASTER_MAPPING[leagueName];
      for (const b of broadcasters) {
        const broadcaster = await prisma.broadcaster.upsert({
          where: { name: b.name },
          update: {},
          create: {
            name: b.name,
            type: 'TV',
            isFree: b.isFree
          }
        });

        await prisma.matchBroadcast.upsert({
          where: {
            matchId_broadcasterId: {
              matchId: match.id,
              broadcasterId: broadcaster.id
            }
          },
          update: {},
          create: {
            matchId: match.id,
            broadcasterId: broadcaster.id
          }
        });
      }

      savedCount++;
    } catch (error) {
      console.error(`  ❌ Error saving ${leagueName} match:`, error.message);
    }
  }

  console.log(`  ✅ ${leagueName} API: Saved ${savedCount} matches`);
  return savedCount;
}

async function fetchAndSave() {
  let totalSaved = 0;

  console.log('  📡 Fetching Euroleague matches from official API...');
  const euroleagueGames = await fetchGamesForLeague('Euroleague');
  if (euroleagueGames.length > 0) {
    totalSaved += await saveMatches(euroleagueGames, 'Euroleague');
  }

  console.log('  📡 Fetching EuroCup matches from official API...');
  const eurocupGames = await fetchGamesForLeague('EuroCup');
  if (eurocupGames.length > 0) {
    totalSaved += await saveMatches(eurocupGames, 'EuroCup');
  }

  return totalSaved;
}

module.exports = {
  fetchAndSave
};
