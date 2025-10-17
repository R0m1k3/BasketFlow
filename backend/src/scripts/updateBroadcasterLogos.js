const { PrismaClient } = require('@prisma/client');
const { getBroadcasterLogo } = require('../utils/logoMapping');

const prisma = new PrismaClient();

async function updateBroadcasterLogos() {
  try {
    console.log('🖼️  Updating broadcaster logos...\n');
    
    const broadcasters = await prisma.broadcaster.findMany();
    
    let updated = 0;
    let notFound = 0;
    
    for (const broadcaster of broadcasters) {
      const logo = getBroadcasterLogo(broadcaster.name);
      
      if (logo) {
        await prisma.broadcaster.update({
          where: { id: broadcaster.id },
          data: { logo }
        });
        console.log(`  ✅ ${broadcaster.name} → ${logo.substring(0, 50)}...`);
        updated++;
      } else {
        console.log(`  ⚠️  ${broadcaster.name} → No logo found`);
        notFound++;
      }
    }
    
    console.log(`\n✅ Updated ${updated} broadcaster logos`);
    if (notFound > 0) {
      console.log(`⚠️  ${notFound} broadcasters without logos`);
    }
    
  } catch (error) {
    console.error('❌ Error updating broadcaster logos:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateBroadcasterLogos();
