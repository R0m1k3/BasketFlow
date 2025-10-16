const { PrismaClient } = require('@prisma/client');
const updateService = require('./src/services/updateService');
const prisma = new PrismaClient();

async function test() {
  console.log('🧹 Cleaning all matches...\n');
  await prisma.match.deleteMany({});
  
  console.log('🔄 Testing all league connectors:\n');
  console.log('='.repeat(60) + '\n');
  
  await updateService.updateMatches();
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESULTS BY LEAGUE:\n');
  
  const leagues = await prisma.league.findMany();
  
  for (const league of leagues) {
    const count = await prisma.match.count({
      where: { leagueId: league.id }
    });
    
    if (count > 0) {
      console.log(`✅ ${league.name}: ${count} matches`);
      
      const sampleMatches = await prisma.match.findMany({
        where: { leagueId: league.id },
        include: {
          homeTeam: true,
          awayTeam: true
        },
        orderBy: { dateTime: 'asc' },
        take: 2
      });
      
      sampleMatches.forEach(m => {
        const date = new Date(m.dateTime).toLocaleString('fr-FR', { 
          weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
        });
        console.log(`   • ${date}: ${m.homeTeam.name} vs ${m.awayTeam.name}`);
      });
      console.log();
    }
  }
  
  const totalMatches = await prisma.match.count();
  console.log(`\n💡 TOTAL: ${totalMatches} matches from official APIs`);
  
  await prisma.$disconnect();
}

test().catch(e => { console.error(e); process.exit(1); });
