#!/bin/bash
# 🔍 Vérification admin dans PostgreSQL

echo "🔍 VÉRIFICATION ADMIN"
echo "====================="
echo ""

# 1. Vérifier PostgreSQL
echo "1️⃣ PostgreSQL :"
if docker exec basket_postgres pg_isready -U basketuser -p 4532 > /dev/null 2>&1; then
    echo "   ✅ PostgreSQL fonctionne"
else
    echo "   ❌ PostgreSQL ne répond pas"
    exit 1
fi

# 2. Lister les tables
echo ""
echo "2️⃣ Tables :"
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "\dt" 2>/dev/null | grep -E "(User|League|Team|Broadcaster|Match)" || echo "   ❌ Tables manquantes"

# 3. Vérifier l'admin
echo ""
echo "3️⃣ Utilisateur admin :"
ADMIN_EXISTS=$(docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -t -c "SELECT COUNT(*) FROM \"User\" WHERE username='admin'" 2>/dev/null | tr -d ' ')

if [ "$ADMIN_EXISTS" = "1" ]; then
    echo "   ✅ Admin existe"
    docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "SELECT id, username, email, role FROM \"User\" WHERE username='admin'"
else
    echo "   ❌ Admin n'existe pas"
    echo ""
    echo "Pour créer l'admin :"
    echo "   ./create-admin-sql.sh"
fi

# 4. Vérifier le mot de passe hashé
echo ""
echo "4️⃣ Hash du mot de passe :"
PASSWORD_HASH=$(docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -t -c "SELECT password FROM \"User\" WHERE username='admin'" 2>/dev/null | tr -d ' ')

if [ -n "$PASSWORD_HASH" ]; then
    echo "   ✅ Mot de passe hashé existe"
    echo "   Hash : ${PASSWORD_HASH:0:30}..."
else
    echo "   ❌ Pas de hash de mot de passe"
fi

# 5. Statut backend
echo ""
echo "5️⃣ Backend :"
if docker ps | grep -q basket_backend; then
    echo "   ✅ Backend actif"
    
    # Vérifier JWT_SECRET
    JWT_SECRET=$(docker exec basket_backend env 2>/dev/null | grep JWT_SECRET | cut -d= -f2)
    if [ -n "$JWT_SECRET" ]; then
        echo "   ✅ JWT_SECRET configuré"
    else
        echo "   ⚠️  JWT_SECRET manquant"
    fi
else
    echo "   ❌ Backend non actif"
fi

# 6. Résumé
echo ""
echo "📊 RÉSUMÉ"
echo "========="

if [ "$ADMIN_EXISTS" = "1" ] && [ -n "$PASSWORD_HASH" ]; then
    echo "✅ Admin configuré correctement"
    echo ""
    echo "🔐 Testez le login :"
    echo "   URL : http://localhost:4000/login"
    echo "   Identifiant : admin"
    echo "   Mot de passe : admin"
else
    echo "❌ Admin non configuré"
    echo ""
    echo "Exécutez : ./create-admin-sql.sh"
fi

echo ""
