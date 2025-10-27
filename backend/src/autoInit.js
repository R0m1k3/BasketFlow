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
          { name: 'NBA', shortName: 'NBA', country: 'USA', isActive: true },
          { name: 'WNBA', shortName: 'WNBA', country: 'USA', isActive: true },
          { name: 'Euroleague', shortName: 'EL', country: 'Europe', isActive: true },
          { name: 'EuroCup', shortName: 'EC', country: 'Europe', isActive: false },
          { name: 'Betclic Elite', shortName: 'LNB', country: 'France', isActive: true }
        ],
        skipDuplicates: true
      });
      console.log('✅ Default leagues created (EuroCup désactivée par défaut)');
    }

    // Insert default broadcasters using Prisma
    // Note: Uses upsert to ensure all broadcasters exist, even if DB was partially initialized
    console.log('📺 Initializing broadcasters...');
    
    const broadcasters = [
      { name: 'beIN Sports', type: 'tv', isFree: false, logo: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Bein_Sports_Logo.svg' },
      { name: 'beIN Sports 1', type: 'tv', isFree: false, logo: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Bein_Sports_Logo.svg' },
      { name: 'beIN Sports 2', type: 'tv', isFree: false, logo: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Bein_Sports_Logo.svg' },
      { name: 'beIN Sports 3', type: 'tv', isFree: false, logo: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Bein_Sports_Logo.svg' },
      { name: 'La Chaîne L\'Équipe', type: 'tv', isFree: true, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/La_chaîne_l%27Equipe_-_logo_2016.png/640px-La_chaîne_l%27Equipe_-_logo_2016.png' },
      { name: 'Prime Video', type: 'streaming', isFree: false, logo: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png' },
      { name: 'DAZN', type: 'streaming', isFree: false, logo: 'https://upload.wikimedia.org/wikipedia/commons/8/84/DAZN_logo.svg' },
      { name: 'SKWEEK', type: 'streaming', isFree: false, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Skweek_logo.svg/640px-Skweek_logo.svg.png' },
      { name: 'NBA League Pass', type: 'streaming', isFree: false, logo: 'https://cdn.worldvectorlogo.com/logos/nba-league-pass.svg' },
      { name: 'EuroLeague TV', type: 'streaming', isFree: false, logo: null },
      { name: 'TV Monaco', type: 'tv', isFree: true, logo: null }
    ];
    
    for (const broadcaster of broadcasters) {
      await prisma.broadcaster.upsert({
        where: { name: broadcaster.name },
        update: { 
          type: broadcaster.type, 
          isFree: broadcaster.isFree,
          logo: broadcaster.logo
        },
        create: broadcaster
      });
    }
    
    console.log(`✅ ${broadcasters.length} broadcasters initialized`);

    console.log('🎉 Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    // Don't crash - let the app continue
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = { autoInit };