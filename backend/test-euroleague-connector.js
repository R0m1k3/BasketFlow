const { fetchEuroleagueSchedule, fetchEurocupSchedule } = require('./src/services/euroleagueConnector');

async function test() {
  console.log('🧪 Testing Euroleague Connector...\n');
  console.log('============================================================\n');
  
  try {
    const euroleagueCount = await fetchEuroleagueSchedule();
    const eurocupCount = await fetchEurocupSchedule();
    
    const total = euroleagueCount + eurocupCount;
    
    console.log('\n============================================================');
    console.log(`\n✅ Total: ${total} matches`);
    console.log(`   - Euroleague: ${euroleagueCount}`);
    console.log(`   - EuroCup: ${eurocupCount}`);
    
    if (total === 0) {
      console.log('\n⚠️  No matches found - API may have changed or endpoint incorrect');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

test();
