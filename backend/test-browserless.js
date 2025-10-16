const browserlessScraper = require('./src/services/browserlessScraper');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  console.log('🧪 Testing Browserless Scrapers...\n');
  console.log('='.repeat(60) + '\n');
  
  let totalMatches = 0;
  
  // Clean old browserless matches
  console.log('🧹 Cleaning old Browserless matches...\n');
  await prisma.match.deleteMany({ 
    where: { externalId: { startsWith: 'browserless-' } }
  });
  
  // Test Euroleague
  console.log('1️⃣  Testing Euroleague scraper...');
  try {
    const elMatches = await browserlessScraper.scrapeEuroleague();
    totalMatches += elMatches;
    console.log(`   ✅ Euroleague: ${elMatches} matches\n`);
  } catch (error) {
    console.error(`   ❌ Euroleague failed: ${error.message}\n`);
  }
  
  // Test EuroCup
  console.log('2️⃣  Testing EuroCup scraper...');
  try {
    const ecMatches = await browserlessScraper.scrapeEurocup();
    totalMatches += ecMatches;
    console.log(`   ✅ EuroCup: ${ecMatches} matches\n`);
  } catch (error) {
    console.error(`   ❌ EuroCup failed: ${error.message}\n`);
  }
  
  // Test Betclic Elite
  console.log('3️⃣  Testing Betclic Elite scraper...');
  try {
    const beMatches = await browserlessScraper.scrapeBetclicElite();
    totalMatches += beMatches;
    console.log(`   ✅ Betclic Elite: ${beMatches} matches\n`);
  } catch (error) {
    console.error(`   ❌ Betclic Elite failed: ${error.message}\n`);
  }
  
  // Test BCL
  console.log('4️⃣  Testing BCL scraper...');
  try {
    const bclMatches = await browserlessScraper.scrapeBCL();
    totalMatches += bclMatches;
    console.log(`   ✅ BCL: ${bclMatches} matches\n`);
  } catch (error) {
    console.error(`   ❌ BCL failed: ${error.message}\n`);
  }
  
  // Display results
  console.log('='.repeat(60));
  console.log(`\n📊 BROWSERLESS SCRAPING RESULTS - ${totalMatches} total matches:\n`);
  
  const matches = await prisma.match.findMany({
    where: { externalId: { startsWith: 'browserless-' } },
    include: {
      homeTeam: true,
      awayTeam: true,
      league: true,
      broadcasts: {
        include: {
          broadcaster: true
        }
      }
    },
    orderBy: { dateTime: 'asc' },
    take: 10
  });
  
  if (matches.length > 0) {
    matches.forEach(m => {
      const date = new Date(m.dateTime).toLocaleString('fr-FR', { 
        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
      });
      const broadcasters = m.broadcasts.map(b => b.broadcaster.name).join(', ');
      console.log(`✓ ${m.league.name}: ${m.homeTeam.name} vs ${m.awayTeam.name}`);
      console.log(`   📅 ${date}${broadcasters ? ` | 📺 ${broadcasters}` : ''}\n`);
    });
    
    if (matches.length === 10 && totalMatches > 10) {
      console.log(`... et ${totalMatches - 10} autres matchs\n`);
    }
  }
  
  console.log(`\n💡 Service Browserless: wss://browserless.vonrodbox.eu`);
  console.log(`✅ Scraping ${totalMatches > 0 ? 'RÉUSSI' : 'ÉCHOUÉ'}\n`);
  
  await prisma.$disconnect();
}

test().catch(e => { 
  console.error('❌ Test error:', e); 
  process.exit(1); 
});
