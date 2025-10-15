const { PrismaClient } = require('@prisma/client');
const { getTeamLogo, getBroadcasterLogo } = require('../utils/logoMapping');

const prisma = new PrismaClient();

async function fixLogos() {
  console.log('🔧 Fixing team and broadcaster logos...\n');

  const teams = await prisma.team.findMany();
  let teamsFixed = 0;

  for (const team of teams) {
    const correctLogo = getTeamLogo(team.name);
    if (correctLogo && correctLogo !== team.logo) {
      await prisma.team.update({
        where: { id: team.id },
        data: { logo: correctLogo }
      });
      console.log(`✅ Fixed logo for ${team.name}`);
      teamsFixed++;
    }
  }

  const broadcasters = await prisma.broadcaster.findMany();
  let broadcastersFixed = 0;

  for (const broadcaster of broadcasters) {
    const correctLogo = getBroadcasterLogo(broadcaster.name);
    if (correctLogo && correctLogo !== broadcaster.logo) {
      await prisma.broadcaster.update({
        where: { id: broadcaster.id },
        data: { logo: correctLogo }
      });
      console.log(`✅ Fixed logo for ${broadcaster.name}`);
      broadcastersFixed++;
    }
  }

  console.log(`\n✨ Done! Fixed ${teamsFixed} teams and ${broadcastersFixed} broadcasters`);
  await prisma.$disconnect();
}

fixLogos().catch(console.error);
