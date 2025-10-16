const { PrismaClient } = require('@prisma/client');
const nbaConnector = require('./nbaConnector');
const euroleagueConnector = require('./euroleagueConnector');
const betclicEliteConnector = require('./betclicEliteConnector');
const prisma = new PrismaClient();

async function updateMatches() {
  try {
    console.log('🏀 Starting match update with Free Basketball APIs...\n');

    await cleanOldMatches();
    
    let totalMatches = 0;

    console.log('📡 Using 100% Free APIs for all leagues\n');
    
    try {
      console.log('1️⃣  NBA - Official NBA API');
      const nbaMatches = await nbaConnector.fetchNBASchedule();
      totalMatches += nbaMatches;
    } catch (error) {
      console.error('  ❌ NBA API failed:', error.message);
    }

    try {
      console.log('\n2️⃣  WNBA - Official WNBA API');
      const wnbaMatches = await nbaConnector.fetchWNBASchedule();
      totalMatches += wnbaMatches;
    } catch (error) {
      console.error('  ❌ WNBA API failed:', error.message);
    }

    try {
      console.log('\n3️⃣  Euroleague - Official XML API');
      const euroleagueMatches = await euroleagueConnector.fetchEuroleagueSchedule();
      totalMatches += euroleagueMatches;
    } catch (error) {
      console.error('  ❌ Euroleague API failed:', error.message);
    }
    
    try {
      console.log('\n4️⃣  EuroCup - Official XML API');
      const eurocupMatches = await euroleagueConnector.fetchEurocupSchedule();
      totalMatches += eurocupMatches;
    } catch (error) {
      console.error('  ❌ EuroCup API failed:', error.message);
    }
    
    try {
      console.log('\n5️⃣  Betclic Elite - TheSportsDB API');
      const betclicMatches = await betclicEliteConnector.fetchBetclicEliteSchedule();
      totalMatches += betclicMatches;
    } catch (error) {
      console.error('  ❌ Betclic Elite API failed:', error.message);
    }

    if (totalMatches === 0) {
      console.log('\n⚠️  No matches found from any source');
    } else {
      console.log(`\n✅ Match update completed: ${totalMatches} total matches`);
      console.log('   📊 Coverage: NBA, WNBA, Euroleague, EuroCup, Betclic Elite');
    }
  } catch (error) {
    console.error('❌ Error in updateMatches:', error);
  }
}

/**
 * Check if a source is enabled (defaults to true)
 */
async function isSourceEnabled(sourceName) {
  const config = await prisma.config.findUnique({
    where: { key: `SOURCE_${sourceName}_ENABLED` }
  });
  
  // Default to enabled if not configured
  if (!config) return true;
  
  return config.value === 'true';
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
  
  const BROADCASTER_MAPPING = {
    NBA: [
      { name: 'beIN Sports', isFree: false, description: '400+ matchs par saison' },
      { name: 'Prime Video', isFree: false, description: '29 matchs du dimanche soir' },
      { name: 'NBA League Pass', isFree: false, description: 'Tous les matchs' }
    ],
    WNBA: [
      { name: 'NBA League Pass', isFree: false },
      { name: 'beIN Sports', isFree: false }
    ],
    Euroleague: [
      { name: 'SKWEEK', isFree: false, description: 'Tous les matchs' },
      { name: "La Chaîne L'Équipe", isFree: true, description: 'Matchs sélectionnés (Paris Basketball, ASVEL)' },
      { name: 'TV Monaco', isFree: true, description: 'Tous les matchs de l\'AS Monaco' },
      { name: 'EuroLeague TV', isFree: false }
    ],
    'Betclic Elite': [
      { name: 'beIN Sports', isFree: false },
      { name: "La Chaîne L'Équipe", isFree: true },
      { name: 'DAZN', isFree: false }
    ],
    EuroCup: [
      { name: 'SKWEEK', isFree: false },
      { name: 'EuroLeague TV', isFree: false }
    ],
    BCL: [
      { name: 'Courtside 1891', isFree: false }
    ]
  };

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
