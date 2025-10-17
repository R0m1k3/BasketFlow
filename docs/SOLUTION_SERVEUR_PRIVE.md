# 🔧 SOLUTION - Login Administration sur Serveur Privé

## 🐛 PROBLÈME

Sur votre serveur privé :
- ❌ **Prisma n'arrive pas à créer les tables**
- ❌ **Login impossible** (Table User n'existe pas)
- ❌ **Migrations échouent** (erreurs visibles dans la console Chrome)

---

## ✅ SOLUTION RAPIDE

### ÉTAPE 1 : Transférer les scripts de réparation

**Sur Replit, téléchargez ces 2 fichiers :**
1. `fix-prisma-serveur.sh` - Script de réparation automatique
2. `diagnostic-serveur.sh` - Script de diagnostic

**Transférez-les sur votre serveur privé :**
```bash
scp fix-prisma-serveur.sh user@serveur:/chemin/basket-flow/
scp diagnostic-serveur.sh user@serveur:/chemin/basket-flow/
```

---

### ÉTAPE 2 : Diagnostic (optionnel)

**Sur votre serveur privé :**
```bash
cd /chemin/vers/basket-flow
chmod +x diagnostic-serveur.sh
./diagnostic-serveur.sh
```

Ce script vous montrera exactement ce qui ne va pas.

---

### ÉTAPE 3 : Réparation automatique

**Sur votre serveur privé :**
```bash
cd /chemin/vers/basket-flow
chmod +x fix-prisma-serveur.sh
./fix-prisma-serveur.sh
```

**Ce script va :**
1. ✅ Arrêter tous les conteneurs
2. ✅ Supprimer complètement la base de données
3. ✅ Redémarrer PostgreSQL seul (20s d'attente)
4. ✅ Créer les tables avec Prisma (`db push --force-reset`)
5. ✅ Créer l'administrateur (admin/admin)
6. ✅ Démarrer le backend
7. ✅ Démarrer le frontend
8. ✅ Vérifier que tout fonctionne

---

## ✅ RÉSULTAT ATTENDU

**Le script affichera :**
```
✅ Tables créées avec succès !
✅ Administrateur créé avec succès !
   👤 Identifiant: admin
   🔑 Mot de passe: admin

🗄️  Tables PostgreSQL:
 User
 League
 Team
 Broadcaster
 Match
 Broadcast
 Session
 Config

👤 Utilisateur admin:
 username | role
----------+-------
 admin    | admin

✅ RÉPARATION TERMINÉE !
🌐 Frontend : http://localhost:4000
🔐 Login    : admin / admin
```

---

## 🔐 TESTER LE LOGIN

1. **Ouvrir** : http://localhost:4000
2. **Cliquer** : "Connexion"
3. **Identifiant** : `admin`
4. **Mot de passe** : `admin`
5. ✅ **Le login devrait maintenant fonctionner !**

---

## 🛠️ SI LE PROBLÈME PERSISTE

### Option 1 : Créer l'admin manuellement

```bash
docker exec basket_backend node src/initAdmin.js
```

---

### Option 2 : Forcer Prisma manuellement

```bash
# Entrer dans le conteneur backend
docker exec -it basket_backend sh

# Forcer la création des tables
npx prisma db push --force-reset --accept-data-loss

# Créer l'admin
node src/initAdmin.js

# Sortir
exit

# Redémarrer le backend
docker-compose restart backend
```

---

### Option 3 : Tout recommencer à zéro

```bash
# Tout supprimer
docker-compose down -v
docker volume rm basket_postgres_data
docker system prune -f

# Vérifier le réseau
docker network create nginx_default 2>/dev/null || true

# Relancer le script de réparation
./fix-prisma-serveur.sh
```

---

## 🔍 VÉRIFICATIONS MANUELLES

### Vérifier que les tables existent

```bash
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "\dt"
```

**Vous devez voir 8 tables :**
- User
- League
- Team
- Broadcaster
- Match
- Broadcast
- Session
- Config
- _prisma_migrations

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

### Vérifier la connexion DATABASE_URL

```bash
docker exec basket_backend env | grep DATABASE_URL
```

**Doit afficher :**
```
DATABASE_URL=postgresql://basketuser:basketpass@basket_postgres:4532/basketdb
```

---

### Vérifier que PostgreSQL est accessible

```bash
# Depuis le backend
docker exec basket_backend ping -c 3 basket_postgres

# Test direct
docker exec basket_postgres pg_isready -U basketuser -p 4532
```

---

## 🚨 ERREURS COURANTES

### Erreur : "relation User does not exist"

**Cause** : Prisma n'a pas créé les tables

**Solution** :
```bash
docker-compose run --rm --no-deps backend npx prisma db push --force-reset
docker exec basket_backend node src/initAdmin.js
```

---

### Erreur : "Cannot connect to database"

**Cause** : PostgreSQL pas démarré ou pas accessible

**Solution** :
```bash
# Vérifier que PostgreSQL fonctionne
docker-compose logs postgres

# Redémarrer PostgreSQL
docker-compose restart postgres
sleep 15

# Redémarrer le backend
docker-compose restart backend
```

---

### Erreur : "Login failed" avec admin/admin

**Cause** : Admin pas créé ou mot de passe incorrect

**Solution** :
```bash
# Recréer l'admin
docker exec basket_backend node src/initAdmin.js

# Vérifier
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "SELECT * FROM \"User\""
```

---

## 📋 CHECKLIST COMPLÈTE

### Avant réparation
- [ ] Fichiers transférés sur le serveur
- [ ] docker-compose.yml contient `sleep 10`
- [ ] Scripts de réparation transférés

### Pendant réparation
- [ ] `./fix-prisma-serveur.sh` exécuté
- [ ] PostgreSQL démarré (20s d'attente)
- [ ] Prisma db push réussi
- [ ] Admin créé

### Après réparation
- [ ] 3 conteneurs running (postgres, backend, frontend)
- [ ] 8 tables créées dans PostgreSQL
- [ ] Admin existe (vérifier avec psql)
- [ ] Login fonctionne (admin/admin)
- [ ] Panel admin accessible

---

## 🎯 COMMANDES RAPIDES

### Diagnostic complet
```bash
./diagnostic-serveur.sh
```

### Réparation complète
```bash
./fix-prisma-serveur.sh
```

### Réinitialisation totale
```bash
docker-compose down -v && \
docker volume rm basket_postgres_data && \
docker network create nginx_default 2>/dev/null || true && \
./fix-prisma-serveur.sh
```

### Logs en temps réel
```bash
docker-compose logs -f backend
```

---

## 🆘 DERNIER RECOURS

Si **absolument rien ne fonctionne**, exécutez cette séquence complète :

```bash
#!/bin/bash
# Réinitialisation d'urgence

cd /chemin/vers/basket-flow

# 1. Tout arrêter
docker-compose down -v
docker volume rm basket_postgres_data 2>/dev/null || true
docker system prune -f

# 2. Réseau
docker network create nginx_default 2>/dev/null || true

# 3. PostgreSQL seul
docker-compose up -d postgres
echo "Attente PostgreSQL (30s)..."
sleep 30

# 4. Test PostgreSQL
docker exec basket_postgres pg_isready -U basketuser -p 4532

# 5. Créer les tables (conteneur temporaire)
docker-compose run --rm --no-deps backend sh -c "npx prisma generate && npx prisma db push --force-reset --accept-data-loss"

# 6. Créer l'admin (conteneur temporaire)
docker-compose run --rm --no-deps backend node src/initAdmin.js

# 7. Vérifier les tables
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "\dt"

# 8. Vérifier l'admin
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "SELECT * FROM \"User\""

# 9. Démarrer le backend
docker-compose up -d backend
sleep 10

# 10. Démarrer le frontend
docker-compose up -d frontend

# 11. Statut final
docker-compose ps
docker-compose logs backend | tail -20

echo ""
echo "✅ Terminé ! Testez le login sur http://localhost:4000"
```

Sauvegardez ce script comme `emergency-reset.sh` et exécutez-le.

---

## 📞 SUPPORT

### Collecter les logs pour diagnostic

```bash
# Créer un fichier de diagnostic complet
./diagnostic-serveur.sh > diagnostic-$(date +%Y%m%d-%H%M%S).txt

# Ou manuellement
docker-compose ps > debug.txt
docker-compose logs postgres >> debug.txt
docker-compose logs backend >> debug.txt
docker-compose logs frontend >> debug.txt
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 -c "\dt" >> debug.txt 2>&1
```

---

## ✅ RÉSUMÉ

**3 commandes pour tout réparer :**

```bash
# 1. Diagnostic
./diagnostic-serveur.sh

# 2. Réparation
./fix-prisma-serveur.sh

# 3. Test
curl http://localhost:4000
# Puis login sur http://localhost:4000/login
```

🎉 **Votre login admin devrait maintenant fonctionner !**
