const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BALLDONTLIE_BASE_URL = 'https://api.balldontlie.io/v1';

const BROADCASTER_MAPPING = {
  NBA: [
    { name: 'beIN Sports', isFree: false },
    { name: 'Prime Video', isFree: false },
    { name: 'NBA League Pass', isFree: false }
  ],
  WNBA: [
    { name: 'NBA League Pass', isFree: false },
    { name: 'beIN Sports', isFree: false }
  ]
};

async function fetchNBAMatches(apiKey) {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 14);

  try {
    const response = await axios.get(`${BALLDONTLIE_BASE_URL}/games`, {
      params: {
        start_date: today.toISOString().split('T')[0],
        end_date: nextWeek.toISOString().split('T')[0],
        seasons: [new Date().getFullYear() - 1] // NBA season 2024-2025
      },
      headers: {
        'Authorization': apiKey
      },
      timeout: 10000
    });

    if (response.data && response.data.data) {
      const games = response.data.data;
      console.log(`  📊 BallDontLie: Found ${games.length} NBA games`);
      return games;
    }
    return [];
  } catch (error) {
    console.error(`  ❌ BallDontLie NBA error:`, error.message);
    return [];
  }
}

async function saveNBAMatches(games) {
  const league = await prisma.league.upsert({
    where: { name: 'NBA' },
    update: {},
    create: {
      name: 'NBA',
      shortName: 'NBA',
      country: 'USA',
      color: '#1D428A'
    }
  });

  let savedCount = 0;

  for (const game of games) {
    try {
      const homeTeam = await prisma.team.upsert({
        where: { id: `balldontlie-${game.home_team.id}` },
        update: { name: game.home_team.full_name },
        create: {
          id: `balldontlie-${game.home_team.id}`,
          name: game.home_team.full_name,
          shortName: game.home_team.abbreviation,
          leagueId: league.id
        }
      });

      const awayTeam = await prisma.team.upsert({
        where: { id: `balldontlie-${game.visitor_team.id}` },
        update: { name: game.visitor_team.full_name },
        create: {
          id: `balldontlie-${game.visitor_team.id}`,
          name: game.visitor_team.full_name,
          shortName: game.visitor_team.abbreviation,
          leagueId: league.id
        }
      });

      const match = await prisma.match.upsert({
        where: { externalId: `balldontlie-${game.id}` },
        update: {
          dateTime: new Date(game.date),
          status: game.status,
          homeScore: game.home_team_score,
          awayScore: game.visitor_team_score
        },
        create: {
          externalId: `balldontlie-${game.id}`,
          leagueId: league.id,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          dateTime: new Date(game.date),
          status: game.status
        }
      });

      const broadcasters = BROADCASTER_MAPPING.NBA;
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
      console.error(`  ❌ Error saving NBA match ${game.id}:`, error.message);
    }
  }

  console.log(`  ✅ BallDontLie: Saved ${savedCount} NBA matches`);
  return savedCount;
}

async function fetchAndSaveNBA(apiKey) {
  if (!apiKey) {
    console.log('  ⚠️  BallDontLie API key not configured, skipping');
    return 0;
  }

  console.log('  📡 Fetching NBA matches from BallDontLie...');
  const games = await fetchNBAMatches(apiKey);
  if (games.length > 0) {
    return await saveNBAMatches(games);
  }
  return 0;
}

module.exports = {
  fetchAndSaveNBA
};
