# 🚀 MODE D'EMPLOI - SERVEUR PRIVÉ

## ✅ CONFIGURATION FINALE

Le fichier `init.sql` s'exécute **automatiquement** au démarrage de PostgreSQL.

---

## 📦 FICHIERS À TRANSFÉRER

**Total : 12 fichiers**

### Frontend (8 fichiers)
```
frontend/src/components/FilterBar.js
frontend/src/pages/Home.js
frontend/src/components/WeeklyMatches.js
frontend/src/components/MonthlyCalendar.js
frontend/src/components/TodayMatches.js
frontend/src/components/DateMatches.js
frontend/src/App.js
frontend/src/components/Header.js
```

### Docker (4 fichiers)
```
docker-compose.yml          ← init.sql automatique
init.sql                    ← Création tables + admin
backend/Dockerfile
backend/package.json
```

---

## 🚀 INSTALLATION COMPLÈTE

**Sur votre serveur privé :**

```bash
# 1. Aller dans le dossier
cd /chemin/vers/basket-flow

# 2. Vérifier que init.sql est présent
ls -l init.sql
# Vous devez voir : -rw-r--r-- 1 user user 7948 Oct 17 14:30 init.sql

# 3. Nettoyer complètement
docker-compose down -v
docker volume rm basket_postgres_data

# 4. Vérifier le réseau
docker network create nginx_default 2>/dev/null || true

# 5. Reconstruire les images
docker-compose build --no-cache

# 6. Démarrer TOUT
docker-compose up -d

# 7. Attendre 30 secondes (PostgreSQL + init.sql + backend)
echo "⏳ Attente initialisation (30s)..."
sleep 30

# 8. Vérifier les logs
docker-compose logs postgres | grep -i "database system is ready"
docker-compose logs backend | grep -i "running"
```

---

## ✅ CE QUI SE PASSE AUTOMATIQUEMENT

### 1️⃣ PostgreSQL démarre
- Exécute automatiquement `/docker-entrypoint-initdb.d/01-init.sql`
- Crée toutes les tables (User, League, Team, etc.)
- Crée l'administrateur (admin/admin)
- Crée la configuration initiale

### 2️⃣ Backend démarre (après 15s)
- Attend que PostgreSQL soit prêt
- Se connecte à la base (tables déjà créées ✅)
- Démarre le serveur sur le port 3888

### 3️⃣ Frontend démarre
- Compile l'application React
- Démarre sur le port 4000

---

## 🔐 TESTER LE LOGIN

```bash
# Vérifier que tout fonctionne
docker-compose ps

# Devrait afficher :
# basket_postgres   running   0.0.0.0:4532->4532/tcp
# basket_backend    running   0.0.0.0:3888->3888/tcp
# basket_frontend   running   0.0.0.0:4000->4000/tcp
```

**Puis ouvrir dans le navigateur :**
- URL : **http://localhost:4000/login**
- Identifiant : `admin`
- Mot de passe : `admin`

✅ **Le login devrait fonctionner !**

---

## 🔍 VÉRIFICATION MANUELLE

### Vérifier que les tables existent

```bash
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "\dt"
```

**Vous devez voir 9 tables :**
- \_prisma_migrations
- Broadcaster
- Config
- League
- Match
- MatchBroadcast
- Session
- Team
- User

---

### Vérifier que l'admin existe

```bash
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "SELECT username, role FROM \"User\""
```

**Doit afficher :**
```
 username | role
----------+-------
 admin    | admin
```

---

## 🛠️ DÉPANNAGE

### Problème : Les tables ne sont pas créées

**Cause** : init.sql ne s'est pas exécuté

**Solution** :
```bash
# 1. Vérifier les logs PostgreSQL
docker-compose logs postgres | grep -i init

# 2. Si init.sql n'apparaît pas, exécuter manuellement
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -f /docker-entrypoint-initdb.d/01-init.sql

# 3. Ou copier et exécuter
docker cp init.sql basket_postgres:/tmp/init.sql
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -f /tmp/init.sql
```

---

### Problème : Login échoue toujours

**Solution rapide** :
```bash
# Recréer l'admin directement
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 <<'EOF'
DELETE FROM "User" WHERE username = 'admin';
INSERT INTO "User" (id, username, email, password, name, role, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid()::text,
    'admin',
    'admin@basket.fr',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Administrateur',
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
EOF

# Redémarrer le backend
docker-compose restart backend
```

---

### Problème : Backend ne démarre pas

**Vérifier les logs** :
```bash
docker-compose logs backend
```

**Si erreur de connexion PostgreSQL** :
```bash
# Redémarrer dans l'ordre
docker-compose restart postgres
sleep 15
docker-compose restart backend
```

---

## 📊 SCRIPT DE DÉPLOIEMENT COMPLET

Créez ce fichier : `deploy.sh`

```bash
#!/bin/bash
set -e

PROJECT_DIR="/chemin/vers/basket-flow"  # MODIFIEZ ICI

echo "🚀 DÉPLOIEMENT BASKET FLOW"
echo "=========================="
echo ""

cd "$PROJECT_DIR" || exit 1

# 1. Vérifier init.sql
if [ ! -f "init.sql" ]; then
    echo "❌ Fichier init.sql manquant"
    exit 1
fi
echo "✅ init.sql présent"

# 2. Nettoyer
echo ""
echo "🧹 Nettoyage..."
docker-compose down -v
docker volume rm basket_postgres_data 2>/dev/null || true

# 3. Réseau
docker network create nginx_default 2>/dev/null || true

# 4. Build
echo ""
echo "🔨 Construction des images..."
docker-compose build --no-cache

# 5. Démarrage
echo ""
echo "🚀 Démarrage des services..."
docker-compose up -d

# 6. Attente
echo ""
echo "⏳ Attente initialisation..."
for i in {30..1}; do
    echo -ne "   $i secondes restantes...\r"
    sleep 1
done
echo ""

# 7. Vérification
echo ""
echo "🔍 VÉRIFICATION"
echo "==============="

# Conteneurs
echo ""
echo "📦 Conteneurs :"
docker-compose ps

# Tables
echo ""
echo "🗄️  Tables PostgreSQL :"
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "\dt" | grep -E "(User|League|Team|Broadcaster|Match)" || echo "   ⚠️  Erreur"

# Admin
echo ""
echo "👤 Admin :"
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -t -c "SELECT username, role FROM \"User\" WHERE username='admin'" || echo "   ⚠️  Admin manquant"

# Logs
echo ""
echo "📋 Logs backend (dernières lignes) :"
docker-compose logs backend | tail -10

echo ""
echo "✅ DÉPLOIEMENT TERMINÉ !"
echo "========================"
echo ""
echo "🌐 Frontend : http://localhost:4000"
echo "🔐 Login    : http://localhost:4000/login"
echo ""
echo "Identifiants :"
echo "  👤 admin"
echo "  🔑 admin"
echo ""
```

**Utilisation :**
```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 🎯 COMMANDE ULTRA-RAPIDE

**Une seule commande pour tout faire :**

```bash
cd /chemin/vers/basket-flow && \
docker-compose down -v && \
docker volume rm basket_postgres_data 2>/dev/null || true && \
docker network create nginx_default 2>/dev/null || true && \
docker-compose up -d && \
sleep 30 && \
echo "✅ Terminé ! → http://localhost:4000/login (admin/admin)"
```

---

## 📋 CHECKLIST FINALE

### Avant déploiement
- [ ] 12 fichiers transférés
- [ ] init.sql présent à la racine
- [ ] docker-compose.yml contient `./init.sql:/docker-entrypoint-initdb.d/01-init.sql`

### Pendant déploiement
- [ ] `docker-compose down -v` exécuté
- [ ] Volume supprimé
- [ ] Images reconstruites
- [ ] Services démarrés

### Après déploiement
- [ ] 3 conteneurs running
- [ ] 9 tables créées
- [ ] Admin existe
- [ ] Login fonctionne (admin/admin)
- [ ] Plus de bouton "Inscription"

---

## 🆘 SUPPORT

### Logs complets
```bash
# Tous les logs
docker-compose logs > basket-flow-logs.txt

# PostgreSQL uniquement
docker-compose logs postgres > postgres-logs.txt

# Backend uniquement
docker-compose logs backend > backend-logs.txt
```

### Diagnostic complet
```bash
echo "=== CONTENEURS ===" && docker-compose ps && \
echo "" && echo "=== TABLES ===" && \
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "\dt" && \
echo "" && echo "=== ADMIN ===" && \
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "SELECT * FROM \"User\"" && \
echo "" && echo "=== LOGS BACKEND ===" && \
docker-compose logs backend | tail -20
```

---

## ✅ RÉSUMÉ

**Avec init.sql automatique, vous n'avez plus besoin de :**
- ❌ Exécuter Prisma manuellement
- ❌ Créer l'admin avec un script
- ❌ Attendre plusieurs démarrages

**Vous avez juste à :**
1. ✅ Transférer les fichiers
2. ✅ Exécuter `docker-compose up -d`
3. ✅ Attendre 30 secondes
4. ✅ Se connecter avec admin/admin

🎉 **C'est tout !**
