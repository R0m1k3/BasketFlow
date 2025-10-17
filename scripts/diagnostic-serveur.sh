#!/bin/bash
# 🔍 Script de diagnostic - Basket Flow
# À exécuter sur votre serveur privé pour voir ce qui ne va pas

echo "🔍 DIAGNOSTIC BASKET FLOW"
echo "=========================="
echo ""

# 1. Docker
echo "1️⃣ DOCKER"
echo "----------"
docker --version
docker-compose --version
echo ""

# 2. Conteneurs
echo "2️⃣ CONTENEURS"
echo "-------------"
docker-compose ps
echo ""

# 3. Réseau
echo "3️⃣ RÉSEAU NGINX_DEFAULT"
echo "------------------------"
if docker network inspect nginx_default > /dev/null 2>&1; then
    echo "✅ Réseau nginx_default existe"
    docker network inspect nginx_default | grep -A 5 "Containers"
else
    echo "❌ Réseau nginx_default n'existe pas"
    echo "   Créez-le avec: docker network create nginx_default"
fi
echo ""

# 4. PostgreSQL
echo "4️⃣ POSTGRESQL"
echo "-------------"
if docker ps | grep -q basket_postgres; then
    echo "✅ Conteneur PostgreSQL actif"
    
    # Test connexion
    if docker exec basket_postgres pg_isready -U basketuser -p 4532 > /dev/null 2>&1; then
        echo "✅ PostgreSQL accepte les connexions"
    else
        echo "❌ PostgreSQL ne répond pas"
    fi
    
    # Liste des bases de données
    echo ""
    echo "Bases de données:"
    docker exec basket_postgres psql -U basketuser -p 4532 -l 2>/dev/null || echo "❌ Impossible de lister"
    
    # Liste des tables
    echo ""
    echo "Tables dans basketdb:"
    docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "\dt" 2>/dev/null || echo "❌ Impossible de lister les tables"
    
    # Nombre d'utilisateurs
    echo ""
    echo "Utilisateurs:"
    docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "SELECT username, role FROM \"User\"" 2>/dev/null || echo "⚠️  Table User n'existe pas"
else
    echo "❌ Conteneur PostgreSQL non actif"
fi
echo ""

# 5. Backend
echo "5️⃣ BACKEND"
echo "----------"
if docker ps | grep -q basket_backend; then
    echo "✅ Conteneur Backend actif"
    
    # Variables d'environnement
    echo ""
    echo "Variables d'environnement importantes:"
    docker exec basket_backend env | grep -E "(DATABASE_URL|JWT_SECRET|NODE_ENV)" || echo "⚠️  Variables manquantes"
    
    # Test connexion à PostgreSQL depuis le backend
    echo ""
    echo "Connectivité Backend → PostgreSQL:"
    docker exec basket_backend ping -c 2 basket_postgres 2>/dev/null && echo "✅ Ping OK" || echo "❌ Ping échoué"
    
    # Logs récents
    echo ""
    echo "Logs backend (dernières 20 lignes):"
    docker-compose logs backend | tail -20
else
    echo "❌ Conteneur Backend non actif"
    echo ""
    echo "Logs backend (dernières 30 lignes):"
    docker-compose logs backend | tail -30
fi
echo ""

# 6. Frontend
echo "6️⃣ FRONTEND"
echo "-----------"
if docker ps | grep -q basket_frontend; then
    echo "✅ Conteneur Frontend actif"
    echo ""
    echo "Logs frontend (dernières 10 lignes):"
    docker-compose logs frontend | tail -10
else
    echo "❌ Conteneur Frontend non actif"
    echo ""
    echo "Logs frontend (dernières 20 lignes):"
    docker-compose logs frontend | tail -20
fi
echo ""

# 7. Volumes
echo "7️⃣ VOLUMES"
echo "----------"
docker volume ls | grep basket || echo "⚠️  Aucun volume basket trouvé"
echo ""

# 8. Images
echo "8️⃣ IMAGES"
echo "---------"
docker images | grep basket || echo "⚠️  Aucune image basket trouvée"
echo ""

# 9. Fichiers de configuration
echo "9️⃣ CONFIGURATION"
echo "----------------"
if [ -f "docker-compose.yml" ]; then
    echo "✅ docker-compose.yml existe"
    
    # Vérifier sleep 10
    if grep -q "sleep 10" docker-compose.yml; then
        echo "✅ Contient 'sleep 10'"
    else
        echo "❌ Ne contient PAS 'sleep 10'"
    fi
    
    # Vérifier nginx_default
    if grep -q "nginx_default" docker-compose.yml; then
        echo "✅ Contient réseau 'nginx_default'"
    else
        echo "❌ Ne contient PAS 'nginx_default'"
    fi
else
    echo "❌ docker-compose.yml introuvable"
fi
echo ""

# 10. Ports
echo "🔟 PORTS"
echo "--------"
echo "Ports en écoute:"
netstat -tulpn 2>/dev/null | grep -E "(4532|3888|4000)" || ss -tulpn 2>/dev/null | grep -E "(4532|3888|4000)" || echo "⚠️  Impossible de lister les ports"
echo ""

echo "📊 RÉSUMÉ"
echo "========="
echo ""
echo "Si PostgreSQL est actif mais sans tables:"
echo "  → Exécutez: ./fix-prisma-serveur.sh"
echo ""
echo "Si PostgreSQL n'est pas actif:"
echo "  → Exécutez: docker-compose up -d postgres && sleep 20"
echo ""
echo "Si le Backend redémarre en boucle:"
echo "  → Vérifiez les logs: docker-compose logs backend"
echo ""
echo "Pour tout réinitialiser:"
echo "  → docker-compose down -v"
echo "  → docker volume rm basket_postgres_data"
echo "  → ./fix-prisma-serveur.sh"
echo ""
