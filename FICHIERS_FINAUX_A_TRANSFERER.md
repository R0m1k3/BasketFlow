# 📦 FICHIERS FINAUX À TRANSFÉRER

## ✅ TOTAL : 11 FICHIERS

### 📱 FRONTEND (8 fichiers)

#### 1. Protection erreur .map (6 fichiers)
```
frontend/src/components/FilterBar.js
frontend/src/pages/Home.js
frontend/src/components/WeeklyMatches.js
frontend/src/components/MonthlyCalendar.js
frontend/src/components/TodayMatches.js
frontend/src/components/DateMatches.js
```

#### 2. Suppression inscription (2 fichiers)
```
frontend/src/App.js              ← Route /register retirée
frontend/src/components/Header.js ← Bouton inscription retiré
```

---

### 🐳 DOCKER (3 fichiers)

```
docker-compose.yml    ← sleep 10 + réseau nginx_default
backend/Dockerfile    ← npm install --production
backend/package.json  ← Dépendances complètes
```

---

## 🚀 COMMANDE DE TRANSFERT

### Option 1 : Git (Recommandé)
```bash
cd /chemin/vers/basket-flow
git pull origin main
```

### Option 2 : SCP (Transfert fichier par fichier)
```bash
# Frontend
scp frontend/src/components/FilterBar.js user@serveur:/chemin/basket-flow/frontend/src/components/
scp frontend/src/pages/Home.js user@serveur:/chemin/basket-flow/frontend/src/pages/
scp frontend/src/components/WeeklyMatches.js user@serveur:/chemin/basket-flow/frontend/src/components/
scp frontend/src/components/MonthlyCalendar.js user@serveur:/chemin/basket-flow/frontend/src/components/
scp frontend/src/components/TodayMatches.js user@serveur:/chemin/basket-flow/frontend/src/components/
scp frontend/src/components/DateMatches.js user@serveur:/chemin/basket-flow/frontend/src/components/
scp frontend/src/App.js user@serveur:/chemin/basket-flow/frontend/src/
scp frontend/src/components/Header.js user@serveur:/chemin/basket-flow/frontend/src/components/

# Docker
scp docker-compose.yml user@serveur:/chemin/basket-flow/
scp backend/Dockerfile user@serveur:/chemin/basket-flow/backend/
scp backend/package.json user@serveur:/chemin/basket-flow/backend/
```

### Option 3 : Archive TAR
```bash
# Sur Replit, créer une archive
tar czf basket-flow-update.tar.gz \
  frontend/src/components/FilterBar.js \
  frontend/src/pages/Home.js \
  frontend/src/components/WeeklyMatches.js \
  frontend/src/components/MonthlyCalendar.js \
  frontend/src/components/TodayMatches.js \
  frontend/src/components/DateMatches.js \
  frontend/src/App.js \
  frontend/src/components/Header.js \
  docker-compose.yml \
  backend/Dockerfile \
  backend/package.json

# Transférer l'archive
scp basket-flow-update.tar.gz user@serveur:/tmp/

# Sur le serveur, extraire
cd /chemin/vers/basket-flow
tar xzf /tmp/basket-flow-update.tar.gz
```

---

## ✅ VÉRIFICATION APRÈS TRANSFERT

```bash
# Sur votre serveur
cd /chemin/vers/basket-flow

# 1. Vérifier App.js (plus de Register)
grep -i "register" frontend/src/App.js
# Ne doit PAS afficher de résultat

# 2. Vérifier Header.js (plus de bouton inscription)
grep -i "inscription" frontend/src/components/Header.js
# Ne doit PAS afficher de résultat

# 3. Vérifier docker-compose.yml (sleep 10)
grep "sleep 10" docker-compose.yml
# Doit afficher : command: sh -c "sleep 10 && npx prisma db push...

# 4. Vérifier FilterBar.js (protection .map)
grep "Array.isArray" frontend/src/components/FilterBar.js
# Doit afficher au moins 2 lignes
```

---

## 🎯 APRÈS LE TRANSFERT

```bash
# 1. Nettoyer complètement
docker-compose down -v
docker volume rm basket_postgres_data

# 2. Reconstruire tout
docker-compose build --no-cache

# 3. Démarrage séquentiel (IMPORTANT)
docker-compose up -d postgres && sleep 15
docker-compose up -d backend && sleep 20
docker-compose up -d frontend

# 4. Vérifier les logs
docker-compose logs backend | tail -30
```

---

## 📋 CHECKLIST

- [ ] 11 fichiers transférés
- [ ] `grep -i register frontend/src/App.js` → Aucun résultat
- [ ] `grep "sleep 10" docker-compose.yml` → Trouvé
- [ ] `docker-compose down -v` exécuté
- [ ] Volume supprimé
- [ ] Images reconstruites
- [ ] PostgreSQL démarré (15s)
- [ ] Backend démarré (20s)
- [ ] Frontend démarré
- [ ] Login fonctionne (admin/admin)
- [ ] Plus de bouton "Inscription"

🎉 **Après ces étapes, tout devrait fonctionner !**
