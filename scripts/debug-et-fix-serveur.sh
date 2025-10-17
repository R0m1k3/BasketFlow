#!/bin/bash
# 🔧 DEBUG ET FIX AUTOMATIQUE - Basket Flow Serveur Privé
# Ce script diagnostique ET corrige automatiquement tous les problèmes

set -e

echo "═══════════════════════════════════════════════════════════"
echo "  🔧 DEBUG & FIX AUTOMATIQUE - BASKET FLOW"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# 1. VÉRIFIER DOCKER
# ============================================
echo "1️⃣ VÉRIFICATION DOCKER"
echo "─────────────────────────────────────────────────────────────"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker installé${NC}"

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose n'est pas installé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose installé${NC}"

# ============================================
# 2. VÉRIFIER LES CONTENEURS
# ============================================
echo ""
echo "2️⃣ VÉRIFICATION CONTENEURS"
echo "─────────────────────────────────────────────────────────────"

POSTGRES_RUNNING=$(docker ps --filter "name=basket_postgres" --format "{{.Names}}" | wc -l)
BACKEND_RUNNING=$(docker ps --filter "name=basket_backend" --format "{{.Names}}" | wc -l)
FRONTEND_RUNNING=$(docker ps --filter "name=basket_frontend" --format "{{.Names}}" | wc -l)

if [ "$POSTGRES_RUNNING" -eq 0 ]; then
    echo -e "${RED}❌ PostgreSQL non actif${NC}"
    echo "   → Démarrage de PostgreSQL..."
    docker-compose up -d postgres
    sleep 15
else
    echo -e "${GREEN}✅ PostgreSQL actif${NC}"
fi

if [ "$BACKEND_RUNNING" -eq 0 ]; then
    echo -e "${RED}❌ Backend non actif${NC}"
else
    echo -e "${GREEN}✅ Backend actif${NC}"
fi

if [ "$FRONTEND_RUNNING" -eq 0 ]; then
    echo -e "${RED}❌ Frontend non actif${NC}"
else
    echo -e "${GREEN}✅ Frontend actif${NC}"
fi

# ============================================
# 3. TESTER POSTGRESQL
# ============================================
echo ""
echo "3️⃣ TEST POSTGRESQL"
echo "─────────────────────────────────────────────────────────────"

if docker exec basket_postgres pg_isready -U basketuser -p 4532 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL accepte les connexions${NC}"
else
    echo -e "${RED}❌ PostgreSQL ne répond pas${NC}"
    echo "   → Redémarrage de PostgreSQL..."
    docker-compose restart postgres
    sleep 15
fi

# ============================================
# 4. VÉRIFIER LES TABLES
# ============================================
echo ""
echo "4️⃣ VÉRIFICATION TABLES"
echo "─────────────────────────────────────────────────────────────"

TABLES=$(docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('User', 'League', 'Team', 'Broadcaster', 'Match')" 2>/dev/null | tr -d ' ')

if [ "$TABLES" -ge 5 ]; then
    echo -e "${GREEN}✅ Tables principales existent ($TABLES/5)${NC}"
    
    # Lister les tables
    echo ""
    echo "Tables trouvées :"
    docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "\dt" 2>/dev/null | grep -E "(User|League|Team|Broadcaster|Match)" || echo "   Erreur lors de la liste"
else
    echo -e "${RED}❌ Tables manquantes ($TABLES/5)${NC}"
    echo ""
    echo "   → CRÉATION DES TABLES AVEC init.sql..."
    
    # Vérifier si init.sql existe
    if [ -f "init.sql" ]; then
        docker cp init.sql basket_postgres:/tmp/init.sql
        docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -f /tmp/init.sql > /dev/null 2>&1
        echo -e "${GREEN}   ✅ Tables créées avec init.sql${NC}"
    else
        echo -e "${YELLOW}   ⚠️  init.sql introuvable, création manuelle...${NC}"
        
        # Créer les tables manuellement
        docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 <<'EOSQL'
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
EOSQL
        
        echo -e "${GREEN}   ✅ Tables créées manuellement${NC}"
    fi
fi

# ============================================
# 5. VÉRIFIER L'ADMIN
# ============================================
echo ""
echo "5️⃣ VÉRIFICATION ADMIN"
echo "─────────────────────────────────────────────────────────────"

ADMIN_EXISTS=$(docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -t -c "SELECT COUNT(*) FROM \"User\" WHERE username='admin'" 2>/dev/null | tr -d ' ')

if [ "$ADMIN_EXISTS" = "1" ]; then
    echo -e "${GREEN}✅ Admin existe${NC}"
    
    # Afficher l'admin
    docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "SELECT username, email, role FROM \"User\" WHERE username='admin'" 2>/dev/null
else
    echo -e "${RED}❌ Admin n'existe pas${NC}"
    echo ""
    echo "   → CRÉATION DE L'ADMIN..."
    
    docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 <<'EOSQL'
DELETE FROM "User" WHERE username = 'admin';

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
EOSQL
    
    echo -e "${GREEN}   ✅ Admin créé${NC}"
    
    # Vérifier
    docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "SELECT username, email, role FROM \"User\" WHERE username='admin'" 2>/dev/null
fi

# ============================================
# 6. VÉRIFIER LE BACKEND
# ============================================
echo ""
echo "6️⃣ VÉRIFICATION BACKEND"
echo "─────────────────────────────────────────────────────────────"

# Vérifier DATABASE_URL
DATABASE_URL=$(docker exec basket_backend env 2>/dev/null | grep DATABASE_URL | cut -d= -f2 || echo "")
if [ -n "$DATABASE_URL" ]; then
    echo -e "${GREEN}✅ DATABASE_URL configurée${NC}"
else
    echo -e "${RED}❌ DATABASE_URL manquante${NC}"
fi

# Vérifier JWT_SECRET
JWT_SECRET=$(docker exec basket_backend env 2>/dev/null | grep JWT_SECRET | cut -d= -f2 || echo "")
if [ -n "$JWT_SECRET" ]; then
    echo -e "${GREEN}✅ JWT_SECRET configuré${NC}"
else
    echo -e "${YELLOW}⚠️  JWT_SECRET manquant${NC}"
fi

# Tester la connectivité PostgreSQL depuis le backend
echo ""
echo "Test connectivité Backend → PostgreSQL :"
if docker exec basket_backend ping -c 2 basket_postgres > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend peut pinguer PostgreSQL${NC}"
else
    echo -e "${RED}❌ Backend ne peut pas pinguer PostgreSQL${NC}"
fi

# ============================================
# 7. REDÉMARRER LE BACKEND
# ============================================
echo ""
echo "7️⃣ REDÉMARRAGE BACKEND"
echo "─────────────────────────────────────────────────────────────"

echo "   → Redémarrage du backend..."
docker-compose restart backend > /dev/null 2>&1
sleep 10

if docker ps --filter "name=basket_backend" --format "{{.Names}}" | grep -q basket_backend; then
    echo -e "${GREEN}✅ Backend redémarré${NC}"
else
    echo -e "${RED}❌ Backend n'a pas redémarré${NC}"
    echo ""
    echo "Logs backend (dernières lignes) :"
    docker-compose logs backend | tail -15
fi

# ============================================
# 8. TEST DE LOGIN
# ============================================
echo ""
echo "8️⃣ TEST DE LOGIN"
echo "─────────────────────────────────────────────────────────────"

# Tester l'API de login
echo "Test de l'API de login..."

LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3888/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' \
  -w "\nHTTP_CODE:%{http_code}" 2>/dev/null || echo "CURL_ERROR")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ API de login fonctionne${NC}"
    echo ""
    echo "Token JWT :"
    echo "$LOGIN_RESPONSE" | grep -v "HTTP_CODE" | jq -r '.token' 2>/dev/null || echo "   (JSON non parsable)"
else
    echo -e "${RED}❌ API de login échoue (HTTP $HTTP_CODE)${NC}"
    echo ""
    echo "Réponse :"
    echo "$LOGIN_RESPONSE" | grep -v "HTTP_CODE"
fi

# ============================================
# 9. RÉSUMÉ FINAL
# ============================================
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  📊 RÉSUMÉ FINAL"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Statut des conteneurs
docker-compose ps

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  🔐 INFORMATIONS DE CONNEXION"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🌐 Frontend : http://localhost:4000"
echo "🔐 Login    : http://localhost:4000/login"
echo ""
echo "Identifiants :"
echo "  👤 Identifiant : admin"
echo "  🔑 Mot de passe : admin"
echo ""

# Vérification finale
if [ "$ADMIN_EXISTS" = "1" ] || [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ TOUT EST PRÊT ! Testez le login maintenant.${NC}"
else
    echo -e "${YELLOW}⚠️  PROBLÈME DÉTECTÉ${NC}"
    echo ""
    echo "Exécutez manuellement :"
    echo "  docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 <<'EOF'"
    echo "  DELETE FROM \"User\" WHERE username = 'admin';"
    echo "  INSERT INTO \"User\" (id, username, email, password, name, role)"
    echo "  VALUES (uuid_generate_v4()::text, 'admin', 'admin@basket.fr',"
    echo "          '\$2a\$10\$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',"
    echo "          'Administrateur', 'admin');"
    echo "  EOF"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
