require('dotenv').config();
const { seedSampleData } = require('./services/updateService');

async function main() {
  console.log('🌱 Seeding database...');
  await seedSampleData();
  console.log('✅ Database seeded successfully');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
