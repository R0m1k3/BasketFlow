const { PrismaClient } = require('@prisma/client');
const rapidApiConnector = require('./src/services/rapidApiBasketballConnector');
const prisma = new PrismaClient();

async function test() {
  // Get API key from config or environment
  const config = await prisma.config.findUnique({
    where: { key: 'RAPIDAPI_BASKETBALL_KEY' }
  });
  
  const apiKey = config?.value || process.env.RAPIDAPI_BASKETBALL_KEY;
  
  if (!apiKey) {
    console.log('❌ No RapidAPI Basketball key found.\n');
    console.log('To test RapidAPI Basketball:');
    console.log('1. Get a FREE key from https://rapidapi.com/fluis.lacasse/api/basketball-api1');
    console.log('2. Add it to admin panel or run:');
    console.log('   RAPIDAPI_BASKETBALL_KEY=your_key node test-rapidapi.js\n');
    await prisma.$disconnect();
    return;
  }
  
  console.log('🧹 Cleaning old RapidAPI matches...\n');
  await prisma.match.deleteMany({ 
    where: { externalId: { startsWith: 'rapidapi-' } }
  });
  
  console.log('🔄 Testing RapidAPI Basketball (all leagues):\n');
  console.log('='.repeat(60) + '\n');
  
  const count = await rapidApiConnector.fetchRapidApiGames(apiKey);
  
  if (count > 0) {
    const matches = await prisma.match.findMany({
      where: { externalId: { startsWith: 'rapidapi-' } },
      include: {
        homeTeam: true,
        awayTeam: true,
        league: true
      },
      orderBy: { dateTime: 'asc' }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 RAPIDAPI BASKETBALL RESULTS - ${matches.length} matches:\n`);
    
    const byLeague = {};
    matches.forEach(m => {
      if (!byLeague[m.league.name]) byLeague[m.league.name] = [];
      byLeague[m.league.name].push(m);
    });
    
    for (const [league, games] of Object.entries(byLeague)) {
      console.log(`✅ ${league}: ${games.length} matches`);
      games.slice(0, 3).forEach(m => {
        const date = new Date(m.dateTime).toLocaleString('fr-FR', { 
          weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
        });
        console.log(`   • ${date}: ${m.homeTeam.name} vs ${m.awayTeam.name}`);
      });
      console.log();
    }
    
    console.log(`\n💡 Total récupéré: ${count} matchs de toutes les ligues`);
  }
  
  await prisma.$disconnect();
}

test().catch(e => { console.error(e); process.exit(1); });
