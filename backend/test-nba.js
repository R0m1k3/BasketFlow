const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  // Clean old NBA matches
  await prisma.match.deleteMany({ where: { externalId: { startsWith: 'nba-' } } });
  await prisma.match.deleteMany({ where: { externalId: { startsWith: 'gemini-' } } });
  
  console.log('🧹 Cleaned old matches\n');
  
  const nbaConnector = require('./src/services/nbaConnector');
  const count = await nbaConnector.fetchNBASchedule();
  
  // Show sample matches
  const matches = await prisma.match.findMany({
    where: { externalId: { startsWith: 'nba-' } },
    include: {
      homeTeam: true,
      awayTeam: true,
      league: true
    },
    orderBy: { dateTime: 'asc' },
    take: 8
  });
  
  console.log(`\n📊 NBA OFFICIAL API - ${matches.length} matchs des 21 prochains jours:\n`);
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
  
  console.log(`\n💡 Total récupéré: ${count} matchs NBA officiels`);
  
  await prisma.$disconnect();
}

test().catch(e => { console.error(e); process.exit(1); });
