const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const openrouterScraper = require('./openrouterScraper');
const prisma = new PrismaClient();

const BROADCASTER_MAPPING = {
  NBA: [
    { name: 'Prime Video', isFree: false, season: '2025-26' },
    { name: 'beIN Sports', isFree: false, season: '2024-25' }
  ],
  WNBA: [
    { name: 'beIN Sports', isFree: false },
    { name: 'NBA League Pass', isFree: false }
  ],
  Euroleague: [
    { name: "La Chaîne L'Équipe", isFree: true },
    { name: 'SKWEEK', isFree: false },
    { name: 'EuroLeague TV', isFree: false }
  ],
  'Betclic Elite': [
    { name: 'DAZN', isFree: false },
    { name: "La Chaîne L'Équipe", isFree: true }
  ],
  EuroCup: [
    { name: 'EuroLeague TV', isFree: false }
  ],
  BCL: [
    { name: 'Courtside 1891', isFree: false }
  ]
};

async function updateMatches() {
  try {
    console.log('🏀 Starting match update with OpenRouter AI...');
    
    const apiKeyConfig = await prisma.config.findUnique({
      where: { key: 'OPENROUTER_API_KEY' }
    });

    if (!apiKeyConfig || !apiKeyConfig.value) {
      console.log('⚠️  OpenRouter API key not configured, using sample data');
      await seedSampleData();
      return;
    }

    await cleanOldMatches();
    
    const result = await openrouterScraper.scrapeAllSources();
    
    if (result.successfulSources === 0) {
      console.log('⚠️  No sources successfully scraped, falling back to sample data');
      await seedSampleData();
      return;
    }
    
    await openrouterScraper.saveMatchesToDatabase(result.matches);
    
    console.log('✅ Match update completed successfully');
  } catch (error) {
    console.error('❌ Error in updateMatches:', error);
    console.log('⚠️  Falling back to sample data');
    await seedSampleData();
  }
}

async function fetchAndUpdateMatchesFromAPI(apiKey) {
  console.log('📡 Fetching matches from API...');

  const LEAGUE_IDS = {
    'NBA': 12,
    'WNBA': 16,
    'Euroleague': 120,
    'Betclic Elite': 117
  };

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 14);

  for (const [leagueName, leagueId] of Object.entries(LEAGUE_IDS)) {
    try {
      const league = await prisma.league.upsert({
        where: { name: leagueName },
        update: {},
        create: {
          name: leagueName,
          shortName: leagueName === 'Betclic Elite' ? 'LNB' : leagueName.substring(0, 3).toUpperCase(),
          country: leagueName.includes('NBA') ? 'USA' : 'Europe',
          color: getLeagueColor(leagueName)
        }
      });

      const response = await axios.get('https://api-basketball.p.rapidapi.com/games', {
        params: {
          league: leagueId,
          season: '2024-2025',
          from: today.toISOString().split('T')[0],
          to: nextWeek.toISOString().split('T')[0]
        },
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'api-basketball.p.rapidapi.com'
        },
        timeout: 10000
      });

      if (response.data && response.data.response) {
        const games = response.data.response;
        console.log(`  Found ${games.length} games for ${leagueName}`);

        for (const game of games) {
          const homeTeam = await prisma.team.upsert({
            where: { id: `${game.teams.home.id}` },
            update: { name: game.teams.home.name },
            create: {
              id: `${game.teams.home.id}`,
              name: game.teams.home.name,
              shortName: game.teams.home.code || game.teams.home.name.substring(0, 3).toUpperCase(),
              leagueId: league.id
            }
          });

          const awayTeam = await prisma.team.upsert({
            where: { id: `${game.teams.away.id}` },
            update: { name: game.teams.away.name },
            create: {
              id: `${game.teams.away.id}`,
              name: game.teams.away.name,
              shortName: game.teams.away.code || game.teams.away.name.substring(0, 3).toUpperCase(),
              leagueId: league.id
            }
          });

          const match = await prisma.match.upsert({
            where: { externalId: `${game.id}` },
            update: {
              dateTime: new Date(game.date),
              status: game.status.short,
              homeScore: game.scores.home.total,
              awayScore: game.scores.away.total
            },
            create: {
              externalId: `${game.id}`,
              leagueId: league.id,
              homeTeamId: homeTeam.id,
              awayTeamId: awayTeam.id,
              dateTime: new Date(game.date),
              venue: game.venue || null,
              status: game.status.short
            }
          });

          const broadcasters = BROADCASTER_MAPPING[leagueName] || [];
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
        }
      }
    } catch (error) {
      console.error(`  Error fetching ${leagueName}:`, error.message);
    }
  }

  console.log('✅ API data synchronized');
}

function getLeagueColor(leagueName) {
  const colors = {
    'NBA': '#1D428A',
    'WNBA': '#C8102E',
    'Euroleague': '#FF7900',
    'EuroCup': '#009CDE',
    'BCL': '#000000',
    'Betclic Elite': '#002654'
  };
  return colors[leagueName] || '#333';
}

async function cleanOldMatches() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const deleted = await prisma.match.deleteMany({
    where: {
      dateTime: {
        lt: sevenDaysAgo
      }
    }
  });

  console.log(`🗑️  Cleaned ${deleted.count} old matches`);
}

async function seedSampleData() {
  console.log('Seeding sample data...');
  
  const leagues = [
    { name: 'NBA', shortName: 'NBA', country: 'USA', color: '#1D428A' },
    { name: 'WNBA', shortName: 'WNBA', country: 'USA', color: '#C8102E' },
    { name: 'Euroleague', shortName: 'EL', country: 'Europe', color: '#FF7900' },
    { name: 'EuroCup', shortName: 'EC', country: 'Europe', color: '#009CDE' },
    { name: 'BCL', shortName: 'BCL', country: 'Europe', color: '#000000' },
    { name: 'Betclic Elite', shortName: 'LNB', country: 'France', color: '#002654' }
  ];

  for (const league of leagues) {
    await prisma.league.upsert({
      where: { name: league.name },
      update: league,
      create: league
    });
  }

  for (const [leagueName, broadcasters] of Object.entries(BROADCASTER_MAPPING)) {
    for (const b of broadcasters) {
      await prisma.broadcaster.upsert({
        where: { name: b.name },
        update: { isFree: b.isFree },
        create: {
          name: b.name,
          type: 'TV',
          isFree: b.isFree
        }
      });
    }
  }

  const nba = await prisma.league.findUnique({ where: { name: 'NBA' } });
  const euroleague = await prisma.league.findUnique({ where: { name: 'Euroleague' } });
  const betclicElite = await prisma.league.findUnique({ where: { name: 'Betclic Elite' } });

  const teams = [
    { name: 'Los Angeles Lakers', shortName: 'LAL', leagueId: nba.id },
    { name: 'Boston Celtics', shortName: 'BOS', leagueId: nba.id },
    { name: 'Paris Basketball', shortName: 'PAR', leagueId: euroleague.id },
    { name: 'ASVEL', shortName: 'ASV', leagueId: euroleague.id },
    { name: 'AS Monaco', shortName: 'ASM', leagueId: betclicElite.id },
    { name: 'Paris Basketball', shortName: 'PAR', leagueId: betclicElite.id }
  ];

  const createdTeams = [];
  for (const team of teams) {
    const created = await prisma.team.upsert({
      where: { id: team.name + team.leagueId },
      update: team,
      create: { ...team, id: team.name + team.leagueId }
    });
    createdTeams.push(created);
  }

  const today = new Date();
  const sampleMatches = [
    {
      externalId: 'sample-nba-1',
      leagueId: nba.id,
      homeTeamId: createdTeams[0].id,
      awayTeamId: createdTeams[1].id,
      dateTime: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      venue: 'Crypto.com Arena',
      broadcasters: ['Prime Video', 'beIN Sports']
    },
    {
      externalId: 'sample-euroleague-1',
      leagueId: euroleague.id,
      homeTeamId: createdTeams[2].id,
      awayTeamId: createdTeams[3].id,
      dateTime: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000),
      venue: 'Adidas Arena',
      broadcasters: ["La Chaîne L'Équipe", 'SKWEEK']
    },
    {
      externalId: 'sample-betclic-1',
      leagueId: betclicElite.id,
      homeTeamId: createdTeams[4].id,
      awayTeamId: createdTeams[5].id,
      dateTime: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
      venue: 'Salle Gaston Médecin',
      broadcasters: ['DAZN', "La Chaîne L'Équipe"]
    }
  ];

  for (const matchData of sampleMatches) {
    const broadcasterNames = matchData.broadcasters;
    delete matchData.broadcasters;

    const match = await prisma.match.upsert({
      where: { externalId: matchData.externalId },
      update: matchData,
      create: matchData
    });

    for (const broadcasterName of broadcasterNames) {
      const broadcaster = await prisma.broadcaster.findUnique({
        where: { name: broadcasterName }
      });

      if (broadcaster) {
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
    }
  }

  console.log('✅ Sample data seeded successfully');
}

module.exports = {
  updateMatches,
  seedSampleData
};
