const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function autoInit() {
  try {
    console.log('🔄 Checking database initialization...');

    // Check if admin user exists using Prisma
    const adminExists = await prisma.user.findUnique({
      where: { username: 'admin' }
    });

    if (!adminExists) {
      console.log('👤 Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin', 10);
      await prisma.user.create({
        data: {
          username: 'admin',
          email: 'admin@basket-flow.com',
          password: hashedPassword,
          name: 'Administrator',
          role: 'admin'
        }
      });
      console.log('✅ Admin user created (username: admin, password: admin)');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Insert default leagues using Prisma
    const leagueCount = await prisma.league.count();
    if (leagueCount === 0) {
      console.log('🏀 Creating default leagues...');
      await prisma.league.createMany({
        data: [
          { name: 'NBA', shortName: 'NBA', country: 'USA' },
          { name: 'WNBA', shortName: 'WNBA', country: 'USA' },
          { name: 'Euroleague', shortName: 'EL', country: 'Europe' },
          { name: 'EuroCup', shortName: 'EC', country: 'Europe' },
          { name: 'Betclic Elite', shortName: 'LNB', country: 'France' }
        ],
        skipDuplicates: true
      });
      console.log('✅ Default leagues created');
    }

    // Insert default broadcasters using Prisma
    const broadcasterCount = await prisma.broadcaster.count();
    if (broadcasterCount === 0) {
      console.log('📺 Creating default broadcasters...');
      await prisma.broadcaster.createMany({
        data: [
          { name: 'BeIN Sports', type: 'TV', isFree: false },
          { name: 'Canal+', type: 'TV', isFree: false },
          { name: 'DAZN', type: 'Streaming', isFree: false },
          { name: 'Eurosport', type: 'TV', isFree: false },
          { name: 'France TV', type: 'TV', isFree: true },
          { name: 'RMC Sport', type: 'TV', isFree: false },
          { name: 'SKWEEK', type: 'Streaming', isFree: false },
          { name: 'NBA League Pass', type: 'Streaming', isFree: false },
          { name: 'LNB TV', type: 'Streaming', isFree: false }
        ],
        skipDuplicates: true
      });
      console.log('✅ Default broadcasters created');
    }

    console.log('🎉 Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    // Don't crash - let the app continue
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { autoInit };