# 🔐 SOLUTION - Login sur Serveur Privé

## ❌ PROBLÈME IDENTIFIÉ

D'après vos logs, **Prisma n'a pas créé les tables dans PostgreSQL**. Les migrations échouent, donc :
- ❌ Table `User` n'existe pas
- ❌ Login impossible
- ❌ Inscription supprimée (comme demandé)

---

## ✅ FICHIERS CORRIGÉS

### 1. Inscription supprimée ✅
- ✅ `App.js` - Route /register retirée
- ✅ `Header.js` - Bouton "Inscription" retiré
- ✅ Seul l'admin peut se connecter (admin/admin)

### 2. Fichiers déjà corrigés
- ✅ 6 fichiers frontend (erreur `.map`)
- ✅ docker-compose.yml (sleep 10 + nginx_default)

---

## 🚀 SOLUTION COMPLÈTE SUR VOTRE SERVEUR

### ÉTAPE 1 : Transférer TOUS les fichiers

**10 fichiers à transférer** (9 précédents + 2 nouveaux) :

**Frontend (7 fichiers) :**
1. `frontend/src/components/FilterBar.js`
2. `frontend/src/pages/Home.js`
3. `frontend/src/components/WeeklyMatches.js`
4. `frontend/src/components/MonthlyCalendar.js`
5. `frontend/src/components/TodayMatches.js`
6. `frontend/src/components/DateMatches.js`
7. **`frontend/src/App.js`** ← NOUVEAU (inscription retirée)
8. **`frontend/src/components/Header.js`** ← NOUVEAU (bouton inscription retiré)

**Docker (3 fichiers) :**
9. `docker-compose.yml` (sleep 10)
10. `backend/Dockerfile`
11. `backend/package.json`

---

### ÉTAPE 2 : Réinitialiser COMPLÈTEMENT la base de données

**Sur votre serveur privé, exécutez :**

```bash
# 1. Aller dans le dossier
cd /chemin/vers/basket-flow

# 2. Arrêter TOUT
docker-compose down -v

# 3. Supprimer le volume PostgreSQL
docker volume rm basket_postgres_data

# 4. Supprimer les conteneurs orphelins
docker container prune -f

# 5. Vérifier le réseau
docker network create nginx_default 2>/dev/null || true
```

---

### ÉTAPE 3 : Reconstruire et redémarrer

```bash
# 1. Reconstruire le frontend
docker-compose build --no-cache frontend

# 2. Reconstruire le backend (important pour Prisma)
docker-compose build --no-cache backend

# 3. Démarrer PostgreSQL seul
docker-compose up -d postgres

# 4. Attendre 15 secondes
echo "⏳ Attente PostgreSQL (15s)..."
sleep 15

# 5. Démarrer le backend
docker-compose up -d backend

# 6. Attendre 20 secondes (Prisma + initAdmin)
echo "⏳ Initialisation backend (20s)..."
sleep 20

# 7. Démarrer le frontend
docker-compose up -d frontend

# 8. Vérifier les logs
docker-compose logs backend
```

---

## ✅ RÉSULTAT ATTENDU

### Logs Backend (devrait afficher) :

```
Waiting 10 seconds for PostgreSQL...
Environment: production
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database

🗄️  Database synchronized with Prisma schema

✅ JWT_SECRET est configuré
✅ Administrateur créé avec succès !
   👤 Identifiant: admin
   🔑 Mot de passe: admin

🏀 Backend server running on port 3888
📅 Daily updates scheduled at 6:00 AM
```

---

## 🔐 TESTER LE LOGIN

1. **Ouvrir** : http://localhost:4000
2. **Cliquer** sur "Connexion" (plus de bouton Inscription ✅)
3. **Identifiant** : `admin`
4. **Mot de passe** : `admin`
5. **Le login devrait fonctionner** ✅

---

## 🛠️ SI ÇA NE MARCHE TOUJOURS PAS

### Option 1 : Forcer Prisma manuellement

```bash
# Entrer dans le conteneur backend
docker exec -it basket_backend sh

# Forcer la création des tables
npx prisma db push --force-reset --accept-data-loss

# Créer l'admin
node src/initAdmin.js

# Vérifier
npm start

# Sortir
exit
```

### Option 2 : Vérifier les tables

```bash
# Se connecter à PostgreSQL
docker exec -it basket_postgres psql -U basketuser -d basketdb -p 4532

# Lister les tables
\dt

# Vous DEVEZ voir ces tables :
# - User
# - League
# - Team
# - Broadcaster  
# - Match
# - Broadcast
# - Session
# - _prisma_migrations

# Vérifier que l'admin existe
SELECT * FROM "User";

# Quitter
\q
```

### Option 3 : Vérifier la connexion

```bash
# Tester la connexion backend → postgres
docker exec basket_backend ping -c 3 basket_postgres

# Tester le port PostgreSQL
docker exec basket_postgres netstat -tulpn | grep 4532

# Vérifier l'URL de connexion
docker exec basket_backend env | grep DATABASE_URL
# Doit afficher : postgresql://basketuser:basketpass@basket_postgres:4532/basketdb
```

---

## 📝 SCRIPT COMPLET DE RÉINITIALISATION

Créez ce script sur votre serveur :

```bash
#!/bin/bash
echo "🔄 Réinitialisation complète Basket Flow"
echo ""

# Variables
PROJECT_DIR="/chemin/vers/basket-flow"  # MODIFIEZ ICI

cd "$PROJECT_DIR" || exit 1

# 1. Arrêter tout
echo "1️⃣ Arrêt des conteneurs..."
docker-compose down -v

# 2. Nettoyer
echo "2️⃣ Nettoyage..."
docker volume rm basket_postgres_data 2>/dev/null || true
docker container prune -f

# 3. Réseau
echo "3️⃣ Vérification réseau..."
docker network create nginx_default 2>/dev/null || true

# 4. Rebuild
echo "4️⃣ Reconstruction images..."
docker-compose build --no-cache

# 5. Démarrage séquentiel
echo "5️⃣ Démarrage PostgreSQL..."
docker-compose up -d postgres
sleep 15

echo "6️⃣ Démarrage Backend..."
docker-compose up -d backend
sleep 20

echo "7️⃣ Démarrage Frontend..."
docker-compose up -d frontend
sleep 5

# 8. Logs
echo ""
echo "📊 Logs Backend :"
docker-compose logs backend | tail -30

echo ""
echo "📊 Logs Frontend :"
docker-compose logs frontend | tail -15

echo ""
echo "✅ Réinitialisation terminée !"
echo "🌐 Frontend : http://localhost:4000"
echo "🔐 Login : admin / admin"
echo ""
echo "🔍 Pour voir les logs en direct :"
echo "   docker-compose logs -f backend"
```

**Utilisation :**

```bash
# Sauvegarder le script
nano reset-basket.sh
# Coller le script ci-dessus
# Modifier PROJECT_DIR

# Rendre exécutable
chmod +x reset-basket.sh

# Exécuter
./reset-basket.sh
```

---

## 🔍 DIAGNOSTIC RAPIDE

```bash
# Statut de tous les conteneurs
docker-compose ps

# Devrait afficher :
# basket_postgres   running   0.0.0.0:4532->4532/tcp
# basket_backend    running   0.0.0.0:3888->3888/tcp
# basket_frontend   running   0.0.0.0:4000->4000/tcp

# Si un conteneur est "Exited" ou "Restarting" :
docker-compose logs <nom_service>
```

---

## ⚠️ ERREURS COMMUNES

### Erreur : "relation User does not exist"
**Solution** : Prisma n'a pas créé les tables
```bash
docker exec basket_backend npx prisma db push --force-reset
docker exec basket_backend node src/initAdmin.js
docker-compose restart backend
```

### Erreur : "Cannot connect to database"
**Solution** : PostgreSQL pas démarré ou mauvais port
```bash
docker-compose up -d postgres
sleep 15
docker-compose restart backend
```

### Erreur : "Duplicate script ID fido2" (Chrome)
**Solution** : Ignorez, c'est une extension Chrome, pas votre app

### Erreur : "Login failed" même avec admin/admin
**Solution** : Admin pas créé
```bash
docker exec basket_backend node src/initAdmin.js
```

---

## 📋 CHECKLIST COMPLÈTE

- [ ] 10 fichiers transférés sur le serveur
- [ ] `docker-compose down -v` exécuté
- [ ] Volume PostgreSQL supprimé
- [ ] Images reconstruites (frontend + backend)
- [ ] PostgreSQL démarré (15s d'attente)
- [ ] Backend démarré (20s d'attente)
- [ ] Frontend démarré
- [ ] Logs backend : "Backend server running"
- [ ] Logs backend : "Administrateur créé"
- [ ] Table User existe (vérifier avec psql)
- [ ] Login fonctionne avec admin/admin
- [ ] Plus de bouton "Inscription"

---

## 🎯 ORDRE EXACT D'EXÉCUTION

```bash
# 1. Transférer fichiers
# (git pull ou scp/rsync)

# 2. Nettoyer
docker-compose down -v && docker volume rm basket_postgres_data

# 3. Rebuild
docker-compose build --no-cache

# 4. Démarrage séquentiel
docker-compose up -d postgres && sleep 15
docker-compose up -d backend && sleep 20  
docker-compose up -d frontend && sleep 5

# 5. Vérifier
docker-compose logs backend | grep -E "(admin|running|error)"
```

---

## 🆘 DERNIER RECOURS

Si absolument rien ne fonctionne :

```bash
# Tout supprimer et recommencer
docker-compose down -v
docker system prune -a -f --volumes
docker network create nginx_default
docker-compose up --build -d

# Attendre 1 minute complète
sleep 60

# Vérifier
docker-compose ps
docker-compose logs backend
```

---

## ✅ FICHIERS MODIFIÉS (Résumé)

| Fichier | Modification |
|---------|--------------|
| App.js | Route /register retirée ✅ |
| Header.js | Bouton inscription retiré ✅ |
| FilterBar.js | Protection .map ✅ |
| Home.js | Protection API ✅ |
| WeeklyMatches.js | Protection .map ✅ |
| MonthlyCalendar.js | Protection .map ✅ |
| TodayMatches.js | Protection .map ✅ |
| DateMatches.js | Protection .map ✅ |
| docker-compose.yml | sleep 10 + nginx_default ✅ |
| Dockerfile | npm install ✅ |
| package.json | Dépendances ✅ |

**Total : 11 fichiers à transférer**

🎉 **Une fois fait, le login devrait fonctionner et l'inscription sera supprimée !**
