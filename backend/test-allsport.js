const { PrismaClient } = require('@prisma/client');
const allsportConnector = require('./src/services/allsportConnector');
const prisma = new PrismaClient();

async function test() {
  // Get API key from config or use test key
  const config = await prisma.config.findUnique({
    where: { key: 'ALLSPORT_API_KEY' }
  });
  
  const apiKey = config?.value || process.env.ALLSPORT_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No AllSportAPI key found.');
    console.log('');
    console.log('To test AllSportAPI:');
    console.log('1. Get a key from https://allsportsapi.com');
    console.log('2. Add it to admin panel or run:');
    console.log('   ALLSPORT_API_KEY=your_key node test-allsport.js');
    await prisma.$disconnect();
    return;
  }
  
  console.log('🧹 Cleaning old AllSport matches...\n');
  await prisma.match.deleteMany({ 
    where: { externalId: { startsWith: 'allsport-' } }
  });
  
  console.log('🔄 Testing AllSportAPI:\n');
  console.log('='.repeat(60) + '\n');
  
  const count = await allsportConnector.fetchAllSportMatches(apiKey);
  
  if (count > 0) {
    const matches = await prisma.match.findMany({
      where: { externalId: { startsWith: 'allsport-' } },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true
      },
      orderBy: { dateTime: 'asc' },
      take: 10
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 ALLSPORTAPI RESULTS - ${matches.length} matches:\n`);
    
    const byLeague = {};
    matches.forEach(m => {
      if (!byLeague[m.league.name]) byLeague[m.league.name] = [];
      byLeague[m.league.name].push(m);
    });
    
    for (const [league, games] of Object.entries(byLeague)) {
      console.log(`✅ ${league}: ${games.length} matches`);
      games.slice(0, 2).forEach(m => {
        const date = new Date(m.dateTime).toLocaleString('fr-FR', { 
          weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
        });
        console.log(`   • ${date}: ${m.homeTeam.name} vs ${m.awayTeam.name}`);
      });
      console.log();
    }
  }
  
  await prisma.$disconnect();
}

test().catch(e => { console.error(e); process.exit(1); });
