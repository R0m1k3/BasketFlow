const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EUROLEAGUE_BASE_URL = 'https://live.euroleague.net/api';
const EUROCUP_BASE_URL = 'https://live.eurocup.com/api';

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
    seasonPrefix: 'E'
  },
  EuroCup: {
    name: 'EuroCup',
    shortName: 'EC',
    country: 'Europe',
    color: '#0066CC',
    baseUrl: EUROCUP_BASE_URL,
    seasonPrefix: 'U'
  }
};

async function fetchGamesForLeague(leagueName) {
  const today = new Date();
  const leagueConfig = LEAGUE_CONFIGS[leagueName];
  const season = `${leagueConfig.seasonPrefix}${today.getFullYear()}`;
  
  try {
    const response = await axios.get(`${leagueConfig.baseUrl}/Games`, {
      params: {
        seasonCode: season
      },
      timeout: 10000
    });

    if (response.data) {
      const games = Array.isArray(response.data) ? response.data : [];
      
      const upcomingGames = games.filter(game => {
        const gameDate = new Date(game.Date);
        const fourteenDaysFromNow = new Date(today);
        fourteenDaysFromNow.setDate(today.getDate() + 14);
        return gameDate >= today && gameDate <= fourteenDaysFromNow;
      });

      console.log(`  📊 ${leagueName} API: Found ${upcomingGames.length} games`);
      return upcomingGames;
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
      const homeTeamId = `${leagueName.toLowerCase()}-${game.HomeTeam?.Code || game.HomeTeam?.Name}`;
      const awayTeamId = `${leagueName.toLowerCase()}-${game.AwayTeam?.Code || game.AwayTeam?.Name}`;
      
      const homeTeam = await prisma.team.upsert({
        where: { id: homeTeamId },
        update: { name: game.HomeTeam?.Name },
        create: {
          id: homeTeamId,
          name: game.HomeTeam?.Name,
          shortName: game.HomeTeam?.Code || game.HomeTeam?.Name?.substring(0, 3).toUpperCase(),
          leagueId: league.id
        }
      });

      const awayTeam = await prisma.team.upsert({
        where: { id: awayTeamId },
        update: { name: game.AwayTeam?.Name },
        create: {
          id: awayTeamId,
          name: game.AwayTeam?.Name,
          shortName: game.AwayTeam?.Code || game.AwayTeam?.Name?.substring(0, 3).toUpperCase(),
          leagueId: league.id
        }
      });

      const externalId = `${leagueName.toLowerCase()}-${game.GameCode || game.GameId}`;
      const match = await prisma.match.upsert({
        where: { externalId },
        update: {
          dateTime: new Date(game.Date),
          status: game.Status || 'Scheduled'
        },
        create: {
          externalId,
          leagueId: league.id,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          dateTime: new Date(game.Date),
          venue: game.Venue || null,
          status: game.Status || 'Scheduled'
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
