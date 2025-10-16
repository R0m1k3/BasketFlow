const { fetchBetclicEliteSchedule, cleanOldBetclicMatches } = require('./src/services/betclicEliteConnector');

async function test() {
  console.log('🧪 Testing Betclic Elite Connector...\n');
  console.log('============================================================\n');
  
  try {
    await cleanOldBetclicMatches();
    const count = await fetchBetclicEliteSchedule();
    
    console.log('\n============================================================');
    console.log(`\n✅ Betclic Elite: ${count} matches`);
    
    if (count === 0) {
      console.log('\n⚠️  No matches found - API may have changed or endpoint incorrect');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

test();
