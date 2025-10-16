const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('🧹 Cleaning old Betclic Elite matches...\n');
  await prisma.match.deleteMany({ 
    where: { externalId: { startsWith: 'betclic-' } }
  });
  
  const betclicConnector = require('./src/services/betclicEliteConnector');
  const count = await betclicConnector.fetchBetclicEliteSchedule();
  
  const matches = await prisma.match.findMany({
    where: { externalId: { startsWith: 'betclic-' } },
    include: {
      homeTeam: true,
      awayTeam: true,
      league: true
    },
    orderBy: { dateTime: 'asc' },
    take: 8
  });
  
  console.log(`\n📊 BETCLIC ELITE OFFICIAL API - ${matches.length} matchs:\n`);
  matches.forEach(m => {
    const date = new Date(m.dateTime).toLocaleString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    console.log(`✅ ${date}: ${m.homeTeam.name} vs ${m.awayTeam.name}`);
  });
  
  console.log(`\n💡 Total: ${count} matchs Betclic Elite`);
  
  await prisma.$disconnect();
}

test().catch(e => { console.error(e); process.exit(1); });
