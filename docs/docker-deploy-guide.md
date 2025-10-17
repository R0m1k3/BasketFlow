# 🚀 Guide de Déploiement Docker - Basket Flow

## ✅ Modifications Effectuées

### 1. Configuration des Ports (Sans Conflits)
- **Frontend** : Port 4000
- **Backend API** : Port 3888  
- **PostgreSQL** : Port 4532

### 2. Dockerfiles Optimisés
- **Backend** : OpenSSL installé, Prisma configuré correctement
- **Frontend** : Utilise `serve` au lieu de nginx

### 3. Réseau Docker
- Network externe : `nginx_default`

---

## 📦 Étapes de Déploiement

### 1. Créer le network Docker

```bash
docker network create nginx_default
```

### 2. ✅ Les secrets sont déjà configurés dans docker-compose.yml

JWT_SECRET et SESSION_SECRET sont **directement intégrés** dans docker-compose.yml pour éviter les problèmes de variables d'environnement.

### 3. Construire et lancer

```bash
# Construire les images
docker-compose build

# Lancer tous les services
docker-compose up -d
```

### 4. Vérifier la création de l'admin

```bash
docker-compose logs backend | grep "Administrateur"
```

Vous verrez :
```
👤 Identifiant: admin
🔑 Mot de passe: admin
```

### 5. Accéder à l'application

- **Frontend** : http://localhost:4000
- **Backend API** : http://localhost:3888/api
- **Login** : 
  - **Identifiant** : `admin`
  - **Mot de passe** : `admin`

---

## 🔧 Commandes Utiles

### Voir les logs en temps réel
```bash
docker-compose logs -f
```

### Voir les logs d'un service spécifique
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Redémarrer un service
```bash
docker-compose restart backend
```

### Arrêter tous les services
```bash
docker-compose down
```

### Arrêter et supprimer les volumes (⚠️ supprime les données)
```bash
docker-compose down -v
```

### Reconstruire après modification
```bash
docker-compose build --no-cache
docker-compose up -d
```

---

## 🐛 Dépannage

### JWT_SECRET manquant
✅ **Résolu** - Le fichier `.env` est créé automatiquement avec des secrets aléatoires

### Le backend ne trouve pas le schéma Prisma
✅ **Résolu** - Le Dockerfile copie `prisma/` avant de générer le client

### Erreur "port already allocated"
✅ **Résolu** - Tous les ports Docker sont différents des ports Replit

### Le frontend ne se connecte pas au backend
- Vérifiez que les services sont bien démarrés : `docker-compose ps`
- Le frontend proxifie `/api` vers le backend via `setupProxy.js`
- Les deux services doivent être sur le network `nginx_default`

### Voir l'état des conteneurs
```bash
docker-compose ps
```

### Vérifier les connexions réseau
```bash
docker network inspect nginx_default
```

---

## 📁 Structure des Fichiers Docker

```
.
├── backend/
│   ├── Dockerfile          # ✅ Node 20 + OpenSSL + Prisma
│   ├── prisma/
│   │   └── schema.prisma   # ✅ Schéma avec username
│   └── src/
│       ├── server.js
│       └── initAdmin.js    # ✅ Crée admin/admin
├── frontend/
│   ├── Dockerfile          # ✅ Build + Serve (pas nginx)
│   ├── .env.docker         # Config pour Docker (port 3888)
│   ├── serve.json          # ⚠️ Pas utilisé avec serve CLI
│   └── src/
├── docker-compose.yml      # ✅ Ports: 4000, 3888, 4532
├── .env                    # ✅ Secrets générés auto
└── docker-deploy-guide.md  # Ce guide

```

### Ports Configurés

| Service | Port Interne Docker | Port Externe | Accès |
|---------|---------------------|--------------|-------|
| Frontend | 4000 | **4000** | http://localhost:4000 |
| Backend | 3888 | **3888** | http://localhost:3888 |
| PostgreSQL | 4532 | **4532** | localhost:4532 |

**Important** : Le frontend accède au backend via `http://localhost:3888` depuis le navigateur (car il est servi en statique)

## 🔒 Sécurité

### ✅ Configuration par Défaut

1. **JWT_SECRET & SESSION_SECRET** : Générés automatiquement (64 caractères hex)
2. **Compte admin** : 
   - Identifiant : `admin`
   - Mot de passe : `admin`
3. **Fichier .env** : Automatiquement ajouté à `.gitignore`

### ⚠️ Actions Recommandées pour la Production

1. **Changer le mot de passe admin** après la première connexion
2. **Modifier initAdmin.js** pour un mot de passe plus sécurisé en production
3. **Régénérer les secrets** pour l'environnement de production
4. **Configurer HTTPS** avec un reverse proxy (nginx, Caddy, Traefik)
5. **Ne jamais commiter** le fichier `.env` avec vos vrais secrets

### 🔄 Régénérer les secrets (si nécessaire)

```bash
# Générer un nouveau JWT_SECRET
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Générer un nouveau SESSION_SECRET
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📊 Monitoring

### Vérifier la santé de la base de données
```bash
docker exec basket_postgres pg_isready -U basketuser -d basketdb
```

### Se connecter à PostgreSQL
```bash
docker exec -it basket_postgres psql -U basketuser -d basketdb
```

---

## ✅ Checklist de Déploiement

### Première Installation

- [ ] 1. Créer le network : `docker network create nginx_default`
- [ ] 2. Vérifier que `.env` existe avec les secrets
- [ ] 3. Supprimer l'ancien Docker : `docker-compose down -v`
- [ ] 4. Construire les images : `docker-compose build --no-cache`
- [ ] 5. Lancer les services : `docker-compose up -d`
- [ ] 6. Vérifier les logs : `docker-compose logs -f backend`
- [ ] 7. Tester le frontend : http://localhost:4000
- [ ] 8. Se connecter avec **admin / admin**
- [ ] 9. (Optionnel) Ajouter la clé API Basketball dans le panel admin

### Vérification Rapide

```bash
# Tout supprimer et recréer
docker-compose down -v

# Reconstruire from scratch
docker-compose build --no-cache

# Lancer
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Tester
curl http://localhost:4000
curl http://localhost:3888/api/leagues
```

**Votre application Docker est prête ! 🎉**

**Login : admin / admin**
