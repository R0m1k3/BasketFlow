# 🚀 DÉPLOIEMENT FINAL - BASKET FLOW

## 📋 RÉSUMÉ DES CORRECTIONS

### ✅ Problèmes Résolus

| Problème | Solution | Fichiers |
|----------|----------|----------|
| ❌ Erreur `.map is not a function` | Protection Array.isArray() | 6 fichiers frontend |
| ❌ Prisma ne crée pas les tables | Ajout `sleep 10` avant migration | docker-compose.yml |
| ❌ Login impossible | Réinitialisation complète BDD | Script fourni |
| ❌ Inscription publique | Suppression route /register | App.js + Header.js |
| ❌ Réseau Docker | Tous sur nginx_default | docker-compose.yml |
| ❌ Build npm échoue | npm install au lieu de npm ci | backend/Dockerfile |

---

## 📦 FICHIERS À TRANSFÉRER

**11 fichiers modifiés :**

### Frontend (8)
1. `frontend/src/components/FilterBar.js`
2. `frontend/src/pages/Home.js`
3. `frontend/src/components/WeeklyMatches.js`
4. `frontend/src/components/MonthlyCalendar.js`
5. `frontend/src/components/TodayMatches.js`
6. `frontend/src/components/DateMatches.js`
7. `frontend/src/App.js` ← **Inscription retirée**
8. `frontend/src/components/Header.js` ← **Bouton inscription retiré**

### Docker (3)
9. `docker-compose.yml` ← **sleep 10 + nginx_default**
10. `backend/Dockerfile`
11. `backend/package.json`

---

## 🚀 DÉPLOIEMENT EN 5 ÉTAPES

### ÉTAPE 1 : Transférer les fichiers

**Sur votre serveur privé :**

```bash
cd /chemin/vers/basket-flow

# Option A : Git (recommandé)
git pull origin main

# Option B : Transférer les 11 fichiers manuellement
# (voir FICHIERS_FINAUX_A_TRANSFERER.md)
```

---

### ÉTAPE 2 : Nettoyer complètement

```bash
# Arrêter tous les conteneurs
docker-compose down -v

# Supprimer le volume PostgreSQL
docker volume rm basket_postgres_data

# Nettoyer les conteneurs orphelins
docker container prune -f

# Vérifier le réseau nginx_default
docker network create nginx_default 2>/dev/null || true
```

---

### ÉTAPE 3 : Reconstruire les images

```bash
# Reconstruire TOUT sans cache
docker-compose build --no-cache

# Vérifier les images
docker images | grep basket
```

---

### ÉTAPE 4 : Démarrage séquentiel (IMPORTANT)

```bash
# 1. PostgreSQL seul
docker-compose up -d postgres
echo "⏳ Attente PostgreSQL (15s)..."
sleep 15

# 2. Backend (avec Prisma)
docker-compose up -d backend
echo "⏳ Initialisation backend (20s)..."
sleep 20

# 3. Frontend
docker-compose up -d frontend
echo "⏳ Compilation frontend (5s)..."
sleep 5
```

**Pourquoi séquentiel ?**
- PostgreSQL doit être COMPLÈTEMENT démarré avant le backend
- Le `sleep 10` dans docker-compose.yml + 15s d'attente = 25s total
- Prisma a besoin de temps pour créer les tables
- initAdmin.js a besoin que les tables existent

---

### ÉTAPE 5 : Vérifier

```bash
# Statut des conteneurs
docker-compose ps

# Devrait afficher :
# basket_postgres   running   0.0.0.0:4532->4532/tcp
# basket_backend    running   0.0.0.0:3888->3888/tcp  
# basket_frontend   running   0.0.0.0:4000->4000/tcp

# Logs backend
docker-compose logs backend | tail -30

# Devrait contenir :
# ✅ Database synchronized
# ✅ Administrateur créé
# 🏀 Backend server running
```

---

## ✅ RÉSULTAT ATTENDU

### Backend (docker-compose logs backend)
```
Waiting 10 seconds for PostgreSQL...
Environment: production
Prisma schema loaded from prisma/schema.prisma

🗄️  Database synchronized with Prisma schema
✅ Tables created: User, League, Team, Broadcaster, Match, Broadcast, Session

✅ JWT_SECRET est configuré
✅ Administrateur créé avec succès !
   👤 Identifiant: admin
   🔑 Mot de passe: admin

🏀 Backend server running on port 3888
📅 Daily updates scheduled at 6:00 AM
```

### Frontend (docker-compose logs frontend)
```
Compiled successfully!

You can now view basket-frontend in the browser.
  Local:            http://localhost:4000

webpack compiled successfully
```

---

## 🔐 TESTER L'APPLICATION

### 1. Page d'accueil
- URL : **http://localhost:4000**
- ✅ Affiche les matchs de la semaine
- ✅ Filtres fonctionnent (Ligue et Chaîne)
- ✅ Pas d'erreur `.map is not a function` dans la console

### 2. Login
- URL : **http://localhost:4000/login**
- ✅ Pas de bouton "Inscription" (supprimé)
- ✅ Formulaire de connexion uniquement
- Identifiant : `admin`
- Mot de passe : `admin`
- ✅ Connexion réussie

### 3. Panel Admin
- URL : **http://localhost:4000/admin**
- ✅ Accessible après login
- ✅ Gestion des logos
- ✅ Toutes les fonctions admin

---

## 🛠️ DÉPANNAGE

### Problème : Login échoue

**Cause** : Table User n'existe pas

```bash
# Solution 1 : Vérifier les tables
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "\dt"

# Si vide, forcer Prisma :
docker exec basket_backend npx prisma db push --force-reset
docker exec basket_backend node src/initAdmin.js
docker-compose restart backend
```

---

### Problème : Backend ne démarre pas

**Cause** : PostgreSQL pas prêt

```bash
# Vérifier PostgreSQL
docker-compose logs postgres

# Redémarrer avec plus de délai
docker-compose down
docker-compose up -d postgres && sleep 20
docker-compose up -d backend
```

---

### Problème : Erreur "Cannot connect to database"

**Cause** : Mauvaise URL de connexion

```bash
# Vérifier la variable
docker exec basket_backend env | grep DATABASE_URL

# Doit afficher :
# DATABASE_URL=postgresql://basketuser:basketpass@basket_postgres:4532/basketdb

# Vérifier la connectivité
docker exec basket_backend ping -c 3 basket_postgres
```

---

### Problème : Frontend affiche toujours ".map is not a function"

**Cause** : Fichiers pas à jour ou cache

```bash
# Vérifier les fichiers
grep "Array.isArray" frontend/src/components/FilterBar.js

# Si pas trouvé, fichier pas à jour
# Retransférer et reconstruire :
docker-compose build --no-cache frontend
docker-compose restart frontend
```

---

## 📊 SCRIPT DE DÉPLOIEMENT COMPLET

Créez ce fichier : `deploy-basket-flow.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Déploiement Basket Flow"
echo "=========================="

PROJECT_DIR="/chemin/vers/basket-flow"  # MODIFIEZ ICI
cd "$PROJECT_DIR" || exit 1

# 1. Nettoyer
echo ""
echo "1️⃣ Nettoyage..."
docker-compose down -v
docker volume rm basket_postgres_data 2>/dev/null || true
docker container prune -f

# 2. Réseau
echo "2️⃣ Vérification réseau..."
docker network create nginx_default 2>/dev/null || true

# 3. Build
echo "3️⃣ Reconstruction images..."
docker-compose build --no-cache

# 4. PostgreSQL
echo "4️⃣ Démarrage PostgreSQL..."
docker-compose up -d postgres
echo "   ⏳ Attente 15 secondes..."
sleep 15

# 5. Backend
echo "5️⃣ Démarrage Backend..."
docker-compose up -d backend
echo "   ⏳ Attente 20 secondes (Prisma + initAdmin)..."
sleep 20

# 6. Frontend
echo "6️⃣ Démarrage Frontend..."
docker-compose up -d frontend
sleep 5

# 7. Statut
echo ""
echo "📊 STATUT"
echo "=========="
docker-compose ps

# 8. Logs
echo ""
echo "📋 LOGS BACKEND (dernières lignes)"
echo "==================================="
docker-compose logs backend | tail -20

echo ""
echo "📋 LOGS FRONTEND (dernières lignes)"
echo "===================================="
docker-compose logs frontend | tail -10

# 9. Vérification
echo ""
echo "🔍 VÉRIFICATION"
echo "==============="

# Vérifier tables
echo -n "Tables PostgreSQL : "
TABLES=$(docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -t -c "\dt" 2>/dev/null | wc -l)
if [ "$TABLES" -gt 5 ]; then
    echo "✅ OK ($TABLES tables)"
else
    echo "❌ ERREUR (tables manquantes)"
fi

# Vérifier admin
echo -n "Admin créé : "
ADMIN=$(docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -t -c "SELECT COUNT(*) FROM \"User\" WHERE username='admin'" 2>/dev/null | tr -d ' ')
if [ "$ADMIN" = "1" ]; then
    echo "✅ OK"
else
    echo "❌ ERREUR"
    echo "   Création manuelle..."
    docker exec basket_backend node src/initAdmin.js
fi

# 10. Résultat
echo ""
echo "✅ DÉPLOIEMENT TERMINÉ !"
echo "========================"
echo "🌐 Frontend : http://localhost:4000"
echo "🔌 Backend  : http://localhost:3888"
echo "🔐 Login    : admin / admin"
echo ""
echo "📊 Voir les logs en temps réel :"
echo "   docker-compose logs -f backend"
```

**Utilisation :**

```bash
# Créer le fichier
nano deploy-basket-flow.sh
# Coller le script
# Modifier PROJECT_DIR

# Rendre exécutable
chmod +x deploy-basket-flow.sh

# Exécuter
./deploy-basket-flow.sh
```

---

## 📋 CHECKLIST FINALE

### Avant déploiement
- [ ] 11 fichiers transférés sur le serveur
- [ ] docker-compose.yml contient `sleep 10`
- [ ] App.js ne contient plus "register"
- [ ] Header.js ne contient plus "Inscription"

### Pendant déploiement
- [ ] `docker-compose down -v` exécuté
- [ ] Volume PostgreSQL supprimé
- [ ] Images reconstruites sans cache
- [ ] PostgreSQL démarré avec 15s d'attente
- [ ] Backend démarré avec 20s d'attente
- [ ] Frontend démarré

### Après déploiement
- [ ] 3 conteneurs running
- [ ] Logs backend : "Backend server running"
- [ ] Logs backend : "Administrateur créé"
- [ ] Tables créées (vérifier avec psql)
- [ ] Login fonctionne (admin/admin)
- [ ] Plus de bouton "Inscription"
- [ ] Filtres fonctionnent
- [ ] Pas d'erreur `.map` dans console

---

## 🎯 COMMANDE UNIQUE

Si vous voulez tout faire en une seule commande :

```bash
cd /chemin/vers/basket-flow && \
docker-compose down -v && \
docker volume rm basket_postgres_data 2>/dev/null || true && \
docker network create nginx_default 2>/dev/null || true && \
docker-compose build --no-cache && \
docker-compose up -d postgres && sleep 15 && \
docker-compose up -d backend && sleep 20 && \
docker-compose up -d frontend && sleep 5 && \
echo "✅ Terminé ! http://localhost:4000"
```

---

## 🌐 ACCÈS FINAL

| Service | URL | Identifiants |
|---------|-----|--------------|
| **Frontend** | http://localhost:4000 | - |
| **Backend API** | http://localhost:3888 | - |
| **Login Admin** | http://localhost:4000/login | admin / admin |
| **Panel Admin** | http://localhost:4000/admin | admin / admin |

---

## 🔐 SÉCURITÉ POST-DÉPLOIEMENT

**⚠️ IMPORTANT - À faire immédiatement :**

1. **Changer le mot de passe admin**
   - Se connecter : http://localhost:4000/login
   - Aller dans le panel admin
   - Changer le mot de passe

2. **Configurer Nginx** (si domaine public)
   - Voir SERVEUR_PRIVE_FINAL.md pour la config Nginx
   - Configurer SSL avec Let's Encrypt

3. **Sauvegardes automatiques**
   ```bash
   # Créer un cron job quotidien
   echo "0 3 * * * docker exec basket_postgres pg_dump -U basketuser basketdb > /backups/basket-\$(date +\%Y\%m\%d).sql" | crontab -
   ```

---

## 📞 SUPPORT

### Logs détaillés
```bash
# Tous les logs depuis le début
docker-compose logs > basket-flow-full.log

# Logs en temps réel
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f backend
```

### Diagnostic complet
```bash
# Script de diagnostic
docker-compose ps
docker network inspect nginx_default
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "\dt"
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "SELECT * FROM \"User\""
docker exec basket_backend env | grep -E "(DATABASE|JWT|SESSION)"
```

---

🎉 **VOTRE APPLICATION BASKET FLOW EST PRÊTE !**

- ✅ Toutes les erreurs `.map` corrigées
- ✅ Prisma fonctionne correctement
- ✅ Login admin opérationnel
- ✅ Inscription publique supprimée
- ✅ Réseau nginx_default configuré
- ✅ Déploiement sur serveur privé

**Prochain étape recommandée :** Configurer Nginx pour un domaine public (optionnel)
