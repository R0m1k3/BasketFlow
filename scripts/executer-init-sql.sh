#!/bin/bash
# 🚀 Exécution du script init.sql sur le serveur privé

echo "🚀 EXÉCUTION INIT.SQL - BASKET FLOW"
echo "===================================="
echo ""

# 1. Vérifier que le fichier init.sql existe
if [ ! -f "init.sql" ]; then
    echo "❌ Erreur : fichier init.sql introuvable"
    echo "   Assurez-vous que init.sql est dans le même dossier"
    exit 1
fi

echo "✅ Fichier init.sql trouvé"
echo ""

# 2. Vérifier que PostgreSQL fonctionne
echo "🔍 Vérification PostgreSQL..."
if docker ps | grep -q basket_postgres; then
    echo "✅ Conteneur PostgreSQL actif"
else
    echo "❌ Conteneur PostgreSQL non actif"
    echo ""
    echo "Démarrez-le avec :"
    echo "  docker-compose up -d postgres"
    exit 1
fi

# 3. Attendre que PostgreSQL soit prêt
echo ""
echo "⏳ Attente PostgreSQL..."
sleep 5

if docker exec basket_postgres pg_isready -U basketuser -p 4532 > /dev/null 2>&1; then
    echo "✅ PostgreSQL est prêt"
else
    echo "⚠️  PostgreSQL pas encore prêt, attente 10s supplémentaires..."
    sleep 10
fi

# 4. Copier init.sql dans le conteneur
echo ""
echo "📋 Copie de init.sql dans le conteneur..."
docker cp init.sql basket_postgres:/tmp/init.sql

# 5. Exécuter init.sql
echo ""
echo "🗄️  Exécution de init.sql..."
docker exec -i basket_postgres psql -U basketuser -d basketdb -p 4532 -f /tmp/init.sql

# 6. Vérifier que tout fonctionne
echo ""
echo "🔍 VÉRIFICATION FINALE"
echo "======================"

# Compter les tables
echo ""
echo "📊 Tables créées :"
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" | tr -d ' ' | sed 's/^/   /'

# Vérifier l'admin
echo ""
echo "👤 Utilisateur admin :"
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "SELECT username, email, role FROM \"User\" WHERE username='admin'"

# 7. Redémarrer le backend
echo ""
echo "🔄 Redémarrage du backend..."
docker-compose restart backend

sleep 5

echo ""
echo "✅ INITIALISATION TERMINÉE !"
echo "============================"
echo ""
echo "🌐 Frontend : http://localhost:4000"
echo "🔐 Login    : http://localhost:4000/login"
echo ""
echo "Identifiants :"
echo "  👤 Identifiant : admin"
echo "  🔑 Mot de passe : admin"
echo ""
echo "⚠️  IMPORTANT : Changez le mot de passe après la première connexion !"
echo ""
