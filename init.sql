-- 🗄️ BASKET FLOW - Script d'initialisation PostgreSQL
-- Ce fichier crée toutes les tables et l'utilisateur admin
-- Exécution : psql -U basketuser -d basketdb -p 4532 -f init.sql

-- ============================================
-- 1. Extensions nécessaires
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. Suppression des tables existantes (optionnel)
-- ============================================

-- Décommentez ces lignes si vous voulez repartir de zéro
-- DROP TABLE IF EXISTS "MatchBroadcast" CASCADE;
-- DROP TABLE IF EXISTS "Match" CASCADE;
-- DROP TABLE IF EXISTS "Broadcaster" CASCADE;
-- DROP TABLE IF EXISTS "Team" CASCADE;
-- DROP TABLE IF EXISTS "League" CASCADE;
-- DROP TABLE IF EXISTS "User" CASCADE;
-- DROP TABLE IF EXISTS "Config" CASCADE;
-- DROP TABLE IF EXISTS "Session" CASCADE;
-- DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;

-- ============================================
-- 3. Création des tables
-- ============================================

-- Table League
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

-- Table Team
CREATE TABLE IF NOT EXISTS "Team" (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(255) NOT NULL,
    "shortName" VARCHAR(100),
    logo TEXT,
    "leagueId" VARCHAR(36),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table Broadcaster
CREATE TABLE IF NOT EXISTS "Broadcaster" (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(255) UNIQUE NOT NULL,
    logo TEXT,
    type VARCHAR(50) NOT NULL,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table Match
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
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("leagueId") REFERENCES "League"(id) ON DELETE CASCADE,
    FOREIGN KEY ("homeTeamId") REFERENCES "Team"(id) ON DELETE CASCADE,
    FOREIGN KEY ("awayTeamId") REFERENCES "Team"(id) ON DELETE CASCADE
);

-- Table MatchBroadcast
CREATE TABLE IF NOT EXISTS "MatchBroadcast" (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "matchId" VARCHAR(36) NOT NULL,
    "broadcasterId" VARCHAR(36) NOT NULL,
    "streamUrl" TEXT,
    notes TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("matchId") REFERENCES "Match"(id) ON DELETE CASCADE,
    FOREIGN KEY ("broadcasterId") REFERENCES "Broadcaster"(id) ON DELETE CASCADE,
    UNIQUE ("matchId", "broadcasterId")
);

-- Table User
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

-- Table Config
CREATE TABLE IF NOT EXISTS "Config" (
    id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table Session (pour express-session)
CREATE TABLE IF NOT EXISTS "Session" (
    sid VARCHAR(255) PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Table des migrations Prisma
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    id VARCHAR(36) PRIMARY KEY,
    checksum VARCHAR(64) NOT NULL,
    finished_at TIMESTAMP,
    migration_name VARCHAR(255) NOT NULL,
    logs TEXT,
    rolled_back_at TIMESTAMP,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    applied_steps_count INTEGER NOT NULL DEFAULT 0
);

-- ============================================
-- 4. Index pour performances
-- ============================================

CREATE INDEX IF NOT EXISTS "Match_dateTime_idx" ON "Match"("dateTime");
CREATE INDEX IF NOT EXISTS "Match_leagueId_idx" ON "Match"("leagueId");
CREATE INDEX IF NOT EXISTS "User_username_idx" ON "User"("username");
CREATE INDEX IF NOT EXISTS "Session_expire_idx" ON "Session"(expire);

-- ============================================
-- 5. Création de l'utilisateur admin
-- ============================================

-- Supprimer l'admin existant si présent
DELETE FROM "User" WHERE username = 'admin';

-- Créer le nouvel admin
-- Hash bcrypt de "admin" (10 rounds)
INSERT INTO "User" (id, username, email, password, name, role, "createdAt", "updatedAt")
VALUES (
    uuid_generate_v4()::text,
    'admin',
    'admin@basket.fr',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Administrateur',
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- ============================================
-- 6. Configuration initiale
-- ============================================

-- Clés API (vides par défaut)
INSERT INTO "Config" (id, key, value, description, "createdAt", "updatedAt")
VALUES 
    (uuid_generate_v4()::text, 'BASKETBALL_DATA_KEY', '', 'Clé API Basketball Data (RapidAPI)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (uuid_generate_v4()::text, 'GEMINI_API_KEY', '', 'Clé API Google Gemini', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- 7. Vérification
-- ============================================

-- Afficher les tables créées
\echo ''
\echo '✅ TABLES CRÉÉES :'
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Afficher l'utilisateur admin
\echo ''
\echo '✅ UTILISATEUR ADMIN :'
SELECT id, username, email, name, role FROM "User" WHERE username = 'admin';

\echo ''
\echo '🎉 INITIALISATION TERMINÉE !'
\echo '🔐 Identifiants de connexion :'
\echo '   👤 Identifiant : admin'
\echo '   🔑 Mot de passe : admin'
\echo ''
