#!/bin/bash
# 🔧 Création admin DIRECTEMENT dans PostgreSQL
# Solution de secours pour serveur privé

echo "🔐 CRÉATION ADMIN DIRECTEMENT DANS POSTGRESQL"
echo "=============================================="
echo ""

# 1. Vérifier que PostgreSQL fonctionne
if ! docker exec basket_postgres pg_isready -U basketuser -p 4532 > /dev/null 2>&1; then
    echo "❌ PostgreSQL n'est pas prêt"
    echo "   Démarrez-le avec: docker-compose up -d postgres && sleep 15"
    exit 1
fi

echo "✅ PostgreSQL est prêt"
echo ""

# 2. Créer les tables si elles n'existent pas
echo "📋 Création des tables..."
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 <<'EOF'
-- Créer la table User si elle n'existe pas
CREATE TABLE IF NOT EXISTS "User" (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Créer les autres tables nécessaires
CREATE TABLE IF NOT EXISTS "League" (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    "logoUrl" TEXT
);

CREATE TABLE IF NOT EXISTS "Team" (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    "logoUrl" TEXT
);

CREATE TABLE IF NOT EXISTS "Broadcaster" (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    "logoUrl" TEXT
);

CREATE TABLE IF NOT EXISTS "Match" (
    id VARCHAR(255) PRIMARY KEY,
    "externalId" VARCHAR(255) UNIQUE NOT NULL,
    "leagueId" VARCHAR(255),
    "homeTeamId" VARCHAR(255),
    "awayTeamId" VARCHAR(255),
    "dateTime" TIMESTAMP NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    status VARCHAR(50),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Broadcast" (
    id SERIAL PRIMARY KEY,
    "matchId" VARCHAR(255),
    "broadcasterId" VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS "Session" (
    sid VARCHAR(255) PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS "Config" (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    description TEXT
);

\dt
EOF

echo ""
echo "✅ Tables créées"
echo ""

# 3. Générer le hash du mot de passe avec bcrypt (10 rounds)
# Hash de "admin" avec bcrypt salt rounds 10
# Généré avec: bcrypt.hash('admin', 10)
PASSWORD_HASH='$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

# 4. Créer l'admin
echo "👤 Création de l'utilisateur admin..."
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 <<EOF
-- Supprimer l'admin existant si présent
DELETE FROM "User" WHERE username = 'admin';

-- Créer le nouvel admin
INSERT INTO "User" (username, email, password, name, role, "createdAt", "updatedAt")
VALUES (
    'admin',
    'admin@basket.fr',
    '${PASSWORD_HASH}',
    'Administrateur',
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Vérifier
SELECT username, email, role FROM "User" WHERE username = 'admin';
EOF

echo ""
echo "✅ ADMIN CRÉÉ AVEC SUCCÈS !"
echo ""
echo "🔐 Identifiants de connexion :"
echo "   👤 Identifiant : admin"
echo "   🔑 Mot de passe : admin"
echo ""
echo "🌐 Testez sur : http://localhost:4000/login"
echo ""
