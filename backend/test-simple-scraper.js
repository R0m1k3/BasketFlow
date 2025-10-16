const { runAllScrapers } = require('./src/services/simpleScraper');

async function test() {
  console.log('🧪 Testing Simple Scrapers...\n');
  console.log('============================================================\n');
  
  try {
    const total = await runAllScrapers();
    
    console.log('\n============================================================');
    console.log(`\n✅ Scraping complete: ${total} total matches`);
    
    if (total === 0) {
      console.log('\n⚠️  No matches found - HTML selectors may need adjustment');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

test();
