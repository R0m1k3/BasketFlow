#!/bin/bash
# 🔧 Script de réparation Prisma - Basket Flow
# À exécuter sur votre serveur privé

set -e

echo "🔧 RÉPARATION PRISMA - BASKET FLOW"
echo "===================================="
echo ""

# 1. Vérifier qu'on est dans le bon dossier
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erreur: docker-compose.yml introuvable"
    echo "   Exécutez ce script depuis le dossier basket-flow"
    exit 1
fi

# 2. Arrêter tout
echo "1️⃣ Arrêt des conteneurs..."
docker-compose down

# 3. Supprimer COMPLÈTEMENT la base de données
echo "2️⃣ Suppression du volume PostgreSQL..."
docker volume rm basket_postgres_data 2>/dev/null || true

# 4. Réseau
echo "3️⃣ Vérification réseau nginx_default..."
docker network create nginx_default 2>/dev/null || true

# 5. Démarrer PostgreSQL seul
echo "4️⃣ Démarrage PostgreSQL..."
docker-compose up -d postgres

echo "   ⏳ Attente 20 secondes (PostgreSQL doit être COMPLÈTEMENT prêt)..."
sleep 20

# 6. Vérifier que PostgreSQL fonctionne
echo "5️⃣ Vérification PostgreSQL..."
if docker exec basket_postgres pg_isready -U basketuser -p 4532 > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL est prêt"
else
    echo "   ❌ PostgreSQL n'est pas prêt"
    echo "   Attendez encore 10 secondes..."
    sleep 10
fi

# 7. Créer les tables MANUELLEMENT (sans docker-compose up)
echo "6️⃣ Création des tables avec Prisma..."

# Démarrer un conteneur temporaire pour Prisma
docker-compose run --rm --no-deps backend sh -c "\
    echo '📋 Génération Prisma Client...' && \
    npx prisma generate && \
    echo '' && \
    echo '🗄️  Création des tables (db push)...' && \
    npx prisma db push --force-reset --accept-data-loss && \
    echo '' && \
    echo '✅ Tables créées avec succès !'"

# 8. Créer l'administrateur
echo "7️⃣ Création de l'administrateur..."
docker-compose run --rm --no-deps backend node src/initAdmin.js

# 9. Démarrer le backend normalement
echo "8️⃣ Démarrage du backend..."
docker-compose up -d backend

sleep 5

# 10. Démarrer le frontend
echo "9️⃣ Démarrage du frontend..."
docker-compose up -d frontend

sleep 5

# 11. Vérification finale
echo ""
echo "🔍 VÉRIFICATION FINALE"
echo "======================"

# Vérifier les conteneurs
echo ""
echo "📦 Conteneurs actifs:"
docker-compose ps

# Vérifier les tables
echo ""
echo "🗄️  Tables PostgreSQL:"
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "\dt" 2>/dev/null || echo "   ⚠️  Impossible de lister les tables"

# Vérifier l'admin
echo ""
echo "👤 Utilisateur admin:"
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "SELECT username, role FROM \"User\"" 2>/dev/null || echo "   ⚠️  Table User introuvable"

# Logs backend
echo ""
echo "📋 Logs backend (dernières lignes):"
docker-compose logs backend | tail -15

echo ""
echo "✅ RÉPARATION TERMINÉE !"
echo "========================"
echo ""
echo "🌐 Frontend : http://localhost:4000"
echo "🔐 Login    : admin / admin"
echo ""
echo "Si le login échoue encore, exécutez :"
echo "  docker exec basket_backend node src/initAdmin.js"
echo ""
