const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EUROLEAGUE_BASE_URL = 'https://live.euroleague.net/api';

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

async function fetchEuroleagueMatches() {
  const today = new Date();
  const season = `E${today.getFullYear()}`;
  
  try {
    const response = await axios.get(`${EUROLEAGUE_BASE_URL}/Games`, {
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

      console.log(`  📊 Euroleague API: Found ${upcomingGames.length} Euroleague games`);
      return upcomingGames;
    }
    return [];
  } catch (error) {
    console.error(`  ❌ Euroleague API error:`, error.message);
    return [];
  }
}

async function saveEuroleagueMatches(games) {
  const league = await prisma.league.upsert({
    where: { name: 'Euroleague' },
    update: {},
    create: {
      name: 'Euroleague',
      shortName: 'EL',
      country: 'Europe',
      color: '#FF6B35'
    }
  });

  let savedCount = 0;

  for (const game of games) {
    try {
      const homeTeam = await prisma.team.upsert({
        where: { id: `euroleague-${game.HomeTeam?.Code || game.HomeTeam?.Name}` },
        update: { name: game.HomeTeam?.Name },
        create: {
          id: `euroleague-${game.HomeTeam?.Code || game.HomeTeam?.Name}`,
          name: game.HomeTeam?.Name,
          shortName: game.HomeTeam?.Code || game.HomeTeam?.Name?.substring(0, 3).toUpperCase(),
          leagueId: league.id
        }
      });

      const awayTeam = await prisma.team.upsert({
        where: { id: `euroleague-${game.AwayTeam?.Code || game.AwayTeam?.Name}` },
        update: { name: game.AwayTeam?.Name },
        create: {
          id: `euroleague-${game.AwayTeam?.Code || game.AwayTeam?.Name}`,
          name: game.AwayTeam?.Name,
          shortName: game.AwayTeam?.Code || game.AwayTeam?.Name?.substring(0, 3).toUpperCase(),
          leagueId: league.id
        }
      });

      const match = await prisma.match.upsert({
        where: { externalId: `euroleague-${game.GameCode || game.GameId}` },
        update: {
          dateTime: new Date(game.Date),
          status: game.Status || 'Scheduled'
        },
        create: {
          externalId: `euroleague-${game.GameCode || game.GameId}`,
          leagueId: league.id,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          dateTime: new Date(game.Date),
          venue: game.Venue || null,
          status: game.Status || 'Scheduled'
        }
      });

      const broadcasters = BROADCASTER_MAPPING.Euroleague;
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
      console.error(`  ❌ Error saving Euroleague match:`, error.message);
    }
  }

  console.log(`  ✅ Euroleague API: Saved ${savedCount} Euroleague matches`);
  return savedCount;
}

async function fetchAndSaveEuroleague() {
  console.log('  📡 Fetching Euroleague matches from official API...');
  const games = await fetchEuroleagueMatches();
  if (games.length > 0) {
    return await saveEuroleagueMatches(games);
  }
  return 0;
}

module.exports = {
  fetchAndSaveEuroleague
};
