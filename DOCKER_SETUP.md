# 🔧 Configuration Docker - Basket Flow

## ⚠️ PROBLÈME: JWT_SECRET Manquant

Si vous voyez cette erreur :
```
❌ ERREUR CRITIQUE: JWT_SECRET n'est pas défini dans les variables d'environnement
```

## ✅ SOLUTION

### 1. Vérifier votre fichier `.env`

Le fichier `.env` à la racine du projet doit contenir **EXACTEMENT** ceci :

```bash
# Configuration Docker - Basketball App
# ATTENTION: Ne jamais commiter ce fichier dans Git!

# API Basketball (optionnel - utilise des données d'exemple si vide)
API_BASKETBALL_KEY=

# Secrets de sécurité (OBLIGATOIRES - générés automatiquement)
JWT_SECRET=9e4460d833531cb04286f0ba350e989d5afb8affb31513e8e779d44c35ad9548
SESSION_SECRET=6073693be610363a5862503445a4cf38fb391efbe502526fa9036902759a4819

# Base de données Docker (Port 4532 pour éviter les conflits)
DATABASE_URL=postgresql://basketuser:basketpass@postgres:4532/basketdb

# Environnement
NODE_ENV=production
PORT=3888
```

### 2. Points Critiques à Vérifier

✅ **DATABASE_URL** : Doit utiliser le port **4532** (pas 5432)
```
DATABASE_URL=postgresql://basketuser:basketpass@postgres:4532/basketdb
```

✅ **PORT** : Doit être **3888** (pas 3000 ou 3001)
```
PORT=3888
```

✅ **JWT_SECRET et SESSION_SECRET** : Doivent être définis
```
JWT_SECRET=9e4460d833531cb04286f0ba350e989d5afb8affb31513e8e779d44c35ad9548
SESSION_SECRET=6073693be610363a5862503445a4cf38fb391efbe502526fa9036902759a4819
```

---

## 🐘 PROBLÈME: Conflit PostgreSQL avec Autre Application

Si vous voyez cette erreur :
```
Error: connect ECONNREFUSED 172.20.0.15:5432
```

Cela signifie qu'une **autre application** essaie de se connecter au port PostgreSQL par défaut (5432).

### ✅ SOLUTIONS

#### Option 1 : Vérifier la Configuration de l'Autre Application

L'autre application qui plante a probablement une variable `DATABASE_URL` qui pointe vers `postgres:5432`.

**Trouvez cette application et modifiez sa DATABASE_URL :**
```bash
# Chercher les conteneurs qui utilisent PostgreSQL
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"

# Vérifier les logs de l'autre application
docker logs <nom_du_conteneur>
```

**Modifiez le fichier `.env` ou `docker-compose.yml` de cette application :**
```bash
# Si elle utilise le MÊME PostgreSQL que Basket Flow
DATABASE_URL=postgresql://basketuser:basketpass@postgres:4532/basketdb

# Si elle a son PROPRE PostgreSQL, utilisez un port différent (ex: 5433)
DATABASE_URL=postgresql://user:pass@postgres_autre:5433/autredb
```

#### Option 2 : Ports Utilisés par Basket Flow

Notre application Basket Flow utilise maintenant ces ports **sans conflit** :

| Service | Port Interne | Port Externe |
|---------|-------------|--------------|
| Frontend | 4000 | 4000 |
| Backend | 3888 | 3888 |
| PostgreSQL | 4532 | 4532 |

**Ces ports sont différents du standard pour éviter les conflits !**

---

## 🚀 Redémarrage Complet

Après avoir corrigé le fichier `.env` :

```bash
# Arrêter tous les conteneurs
docker-compose down

# Supprimer les volumes (⚠️ efface les données)
docker-compose down -v

# Reconstruire sans cache
docker-compose build --no-cache

# Redémarrer
docker-compose up -d

# Vérifier les logs
docker-compose logs -f backend
```

---

## 📋 Checklist de Diagnostic

- [ ] Le fichier `.env` existe à la racine du projet
- [ ] `JWT_SECRET` est défini dans `.env`
- [ ] `SESSION_SECRET` est défini dans `.env`
- [ ] `DATABASE_URL` utilise le port **4532** (pas 5432)
- [ ] `PORT=3888` dans `.env`
- [ ] Aucune autre application n'utilise les ports 4000, 3888, ou 4532
- [ ] `docker-compose ps` montre tous les conteneurs en "Up"

---

## 🆘 Commandes de Dépannage

### Vérifier les Ports en Conflit
```bash
# Ports utilisés sur votre serveur
sudo netstat -tulpn | grep -E '4000|3888|4532'

# Conteneurs Docker actifs
docker ps -a
```

### Vérifier les Variables d'Environnement dans le Conteneur
```bash
docker exec basket_backend env | grep -E 'JWT_SECRET|PORT|DATABASE_URL'
```

### Tester la Connexion PostgreSQL
```bash
docker exec basket_postgres pg_isready -U basketuser -d basketdb -p 4532
```

### Voir les Logs en Détail
```bash
# Backend
docker-compose logs backend --tail=100

# PostgreSQL
docker-compose logs postgres --tail=100

# Tous les services
docker-compose logs --tail=50
```

---

## ✅ Configuration Finale Attendue

Votre fichier `.env` **DOIT** ressembler à ceci :

```bash
API_BASKETBALL_KEY=
JWT_SECRET=9e4460d833531cb04286f0ba350e989d5afb8affb31513e8e779d44c35ad9548
SESSION_SECRET=6073693be610363a5862503445a4cf38fb391efbe502526fa9036902759a4819
DATABASE_URL=postgresql://basketuser:basketpass@postgres:4532/basketdb
NODE_ENV=production
PORT=3888
```

**Ports finaux :**
- Frontend : http://localhost:4000
- Backend : http://localhost:3888
- PostgreSQL : localhost:4532

🎉 **Votre application devrait maintenant fonctionner sans conflits !**
