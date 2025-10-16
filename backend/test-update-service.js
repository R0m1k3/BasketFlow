const { updateMatches } = require('./src/services/updateService');

async function test() {
  console.log('🧪 Testing Complete Update Service...\n');
  console.log('============================================================\n');
  
  try {
    await updateMatches();
    
    console.log('\n============================================================');
    console.log('\n✅ Update service test completed');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

test();
