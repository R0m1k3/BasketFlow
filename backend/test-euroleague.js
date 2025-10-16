const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('🧹 Cleaning old Euroleague/Eurocup matches...\n');
  await prisma.match.deleteMany({ 
    where: { 
      OR: [
        { externalId: { startsWith: 'euroleague-' } },
        { externalId: { startsWith: 'eurocup-' } }
      ]
    } 
  });
  
  const euroleagueConnector = require('./src/services/euroleagueConnector');
  
  const elCount = await euroleagueConnector.fetchEuroleagueSchedule();
  const ecCount = await euroleagueConnector.fetchEurocupSchedule();
  
  // Show sample matches
  const matches = await prisma.match.findMany({
    where: { 
      OR: [
        { externalId: { startsWith: 'euroleague-' } },
        { externalId: { startsWith: 'eurocup-' } }
      ]
    },
    include: {
      homeTeam: true,
      awayTeam: true,
      league: true
    },
    orderBy: { dateTime: 'asc' },
    take: 8
  });
  
  console.log(`\n📊 EUROLEAGUE/EUROCUP OFFICIAL API - ${matches.length} matchs:\n`);
  matches.forEach(m => {
    const date = new Date(m.dateTime).toLocaleString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    console.log(`✅ [${m.league.name}] ${date}: ${m.homeTeam.name} vs ${m.awayTeam.name}`);
  });
  
  console.log(`\n💡 Total: ${elCount} Euroleague + ${ecCount} Eurocup = ${elCount + ecCount} matchs`);
  
  await prisma.$disconnect();
}

test().catch(e => { console.error(e); process.exit(1); });
