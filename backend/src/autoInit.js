// 🔧 Auto-initialisation de la base de données
// Ce script s'exécute automatiquement au démarrage du backend
// Il crée les tables et l'admin si nécessaire

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function autoInit() {
  try {
    console.log('🔍 Vérification de la base de données...');
    await client.connect();

    // Vérifier si la table User existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      );
    `);

    const tableExists = tableCheck.rows[0].exists;

    if (!tableExists) {
      console.log('📋 Tables inexistantes, création automatique...');
      
      // Créer l'extension UUID
      await client.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
      
      // Créer toutes les tables
      await client.query(`
        CREATE TABLE IF NOT EXISTS "User" (
          id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
          username VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255),
          password VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'user',
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "League" (
          id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
          name VARCHAR(255) UNIQUE NOT NULL,
          "shortName" VARCHAR(50) NOT NULL,
          country VARCHAR(100) NOT NULL,
          logo TEXT,
          color VARCHAR(20),
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "Team" (
          id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
          name VARCHAR(255) NOT NULL,
          "shortName" VARCHAR(100),
          logo TEXT,
          "leagueId" VARCHAR(36),
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "Broadcaster" (
          id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
          name VARCHAR(255) UNIQUE NOT NULL,
          logo TEXT,
          type VARCHAR(50) NOT NULL,
          "isFree" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "Match" (
          id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
          "leagueId" VARCHAR(36) NOT NULL,
          "homeTeamId" VARCHAR(36) NOT NULL,
          "awayTeamId" VARCHAR(36) NOT NULL,
          "dateTime" TIMESTAMP NOT NULL,
          venue TEXT,
          status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
          "homeScore" INTEGER,
          "awayScore" INTEGER,
          "externalId" VARCHAR(255) UNIQUE,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "MatchBroadcast" (
          id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
          "matchId" VARCHAR(36) NOT NULL,
          "broadcasterId" VARCHAR(36) NOT NULL,
          "streamUrl" TEXT,
          notes TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "Config" (
          id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
          key VARCHAR(255) UNIQUE NOT NULL,
          value TEXT NOT NULL,
          description TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "Session" (
          sid VARCHAR(255) PRIMARY KEY,
          sess JSON NOT NULL,
          expire TIMESTAMP NOT NULL
        );

        CREATE INDEX IF NOT EXISTS "Match_dateTime_idx" ON "Match"("dateTime");
        CREATE INDEX IF NOT EXISTS "Match_leagueId_idx" ON "Match"("leagueId");
        CREATE INDEX IF NOT EXISTS "User_username_idx" ON "User"("username");
      `);
      
      console.log('✅ Tables créées avec succès');
    } else {
      console.log('✅ Tables déjà existantes');
    }

    // Vérifier si l'admin existe
    const adminCheck = await client.query(`
      SELECT COUNT(*) FROM "User" WHERE username = 'admin';
    `);

    const adminExists = parseInt(adminCheck.rows[0].count) > 0;

    if (!adminExists) {
      console.log('👤 Création de l\'administrateur...');
      
      // Hash du mot de passe "admin" (généré avec bcrypt rounds=10)
      const passwordHash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
      
      await client.query(`
        INSERT INTO "User" (id, username, email, password, name, role, "createdAt", "updatedAt")
        VALUES (
          uuid_generate_v4()::text,
          'admin',
          'admin@basket.fr',
          $1,
          'Administrateur',
          'admin',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        );
      `, [passwordHash]);
      
      console.log('✅ Administrateur créé avec succès !');
      console.log('   👤 Identifiant : admin');
      console.log('   🔑 Mot de passe : admin');
    } else {
      console.log('✅ Administrateur déjà existant');
    }

    console.log('');
    console.log('🎉 Base de données prête !');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation :', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Exécuter l'initialisation
autoInit();
