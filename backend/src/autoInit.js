const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://basketuser:basketpass@postgres:4532/basketdb';

async function autoInit() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log('🔄 Checking database initialization...');

    // Check if User table exists
    const checkTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      );
    `);

    if (!checkTable.rows[0].exists) {
      console.log('📦 Creating database tables...');
      
      // Create all tables
      await client.query(`
        -- Create User table
        CREATE TABLE IF NOT EXISTS "User" (
          "id" SERIAL PRIMARY KEY,
          "username" VARCHAR(100) UNIQUE NOT NULL,
          "email" VARCHAR(255) UNIQUE NOT NULL,
          "password" VARCHAR(255) NOT NULL,
          "role" VARCHAR(50) DEFAULT 'USER',
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create League table
        CREATE TABLE IF NOT EXISTS "League" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR(100) NOT NULL,
          "code" VARCHAR(50) UNIQUE NOT NULL,
          "logoUrl" TEXT,
          "isActive" BOOLEAN DEFAULT true,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create Team table
        CREATE TABLE IF NOT EXISTS "Team" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR(100) NOT NULL,
          "logoUrl" TEXT,
          "city" VARCHAR(100),
          "leagueId" INTEGER REFERENCES "League"("id") ON DELETE CASCADE,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE("name", "leagueId")
        );

        -- Create Broadcaster table
        CREATE TABLE IF NOT EXISTS "Broadcaster" (
          "id" SERIAL PRIMARY KEY,
          "name" VARCHAR(100) UNIQUE NOT NULL,
          "logoUrl" TEXT,
          "type" VARCHAR(50),
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create Match table
        CREATE TABLE IF NOT EXISTS "Match" (
          "id" SERIAL PRIMARY KEY,
          "externalId" VARCHAR(255) UNIQUE,
          "homeTeamId" INTEGER REFERENCES "Team"("id") ON DELETE CASCADE,
          "awayTeamId" INTEGER REFERENCES "Team"("id") ON DELETE CASCADE,
          "leagueId" INTEGER REFERENCES "League"("id") ON DELETE CASCADE,
          "date" TIMESTAMP NOT NULL,
          "status" VARCHAR(50),
          "homeScore" INTEGER,
          "awayScore" INTEGER,
          "round" VARCHAR(100),
          "season" VARCHAR(50),
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create MatchBroadcast table
        CREATE TABLE IF NOT EXISTS "MatchBroadcast" (
          "id" SERIAL PRIMARY KEY,
          "matchId" INTEGER REFERENCES "Match"("id") ON DELETE CASCADE,
          "broadcasterId" INTEGER REFERENCES "Broadcaster"("id") ON DELETE CASCADE,
          "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE("matchId", "broadcasterId")
        );

        -- Create Config table
        CREATE TABLE IF NOT EXISTS "Config" (
          "id" SERIAL PRIMARY KEY,
          "key" VARCHAR(100) UNIQUE NOT NULL,
          "value" TEXT,
          "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS "idx_match_date" ON "Match"("date");
        CREATE INDEX IF NOT EXISTS "idx_match_league" ON "Match"("leagueId");
        CREATE INDEX IF NOT EXISTS "idx_match_teams" ON "Match"("homeTeamId", "awayTeamId");
        CREATE INDEX IF NOT EXISTS "idx_team_league" ON "Team"("leagueId");
        CREATE INDEX IF NOT EXISTS "idx_match_external" ON "Match"("externalId");
      `);

      console.log('✅ Database tables created successfully!');
    } else {
      console.log('✅ Database tables already exist');
    }

    // Check if admin user exists
    const checkAdmin = await client.query(`
      SELECT id FROM "User" WHERE username = 'admin'
    `);

    if (checkAdmin.rows.length === 0) {
      console.log('👤 Creating admin user...');
      
      const hashedPassword = await bcrypt.hash('admin', 10);
      await client.query(`
        INSERT INTO "User" (id, username, email, password, name, role, "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'admin', 'admin@basket-flow.com', $1, 'Administrator', 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [hashedPassword]);

      console.log('✅ Admin user created (username: admin, password: admin)');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Insert default leagues (matching exact Prisma schema)
    const checkLeagues = await client.query(`SELECT COUNT(*) FROM "League"`);
    
    if (checkLeagues.rows[0].count === '0') {
      console.log('🏀 Creating default leagues...');
      
      await client.query(`
        INSERT INTO "League" (id, name, "shortName", country, "createdAt", "updatedAt") VALUES
        (gen_random_uuid(), 'NBA', 'NBA', 'USA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), 'WNBA', 'WNBA', 'USA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), 'Euroleague', 'EL', 'Europe', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), 'EuroCup', 'EC', 'Europe', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), 'Betclic Elite', 'LNB', 'France', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (name) DO NOTHING
      `);

      console.log('✅ Default leagues created');
    }

    // Insert default broadcasters (matching exact Prisma schema)
    const checkBroadcasters = await client.query(`SELECT COUNT(*) FROM "Broadcaster"`);
    
    if (checkBroadcasters.rows[0].count === '0') {
      console.log('📺 Creating default broadcasters...');
      
      await client.query(`
        INSERT INTO "Broadcaster" (id, name, type, "isFree", "createdAt", "updatedAt") VALUES
        (gen_random_uuid(), 'BeIN Sports', 'TV', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), 'Canal+', 'TV', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), 'DAZN', 'Streaming', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), 'Eurosport', 'TV', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), 'France TV', 'TV', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), 'RMC Sport', 'TV', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), 'SKWEEK', 'Streaming', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), 'NBA League Pass', 'Streaming', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (gen_random_uuid(), 'LNB TV', 'Streaming', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (name) DO NOTHING
      `);

      console.log('✅ Default broadcasters created');
    }

    console.log('🎉 Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    // Don't crash - let the app continue
  } finally {
    await client.end();
  }
}

module.exports = { autoInit };