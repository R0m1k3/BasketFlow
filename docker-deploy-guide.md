# 🚀 Guide de Déploiement Docker - Basketball App

## ✅ Modifications Effectuées

### 1. Configuration des Ports (Sans Conflits)
- **Frontend** : Port 4000
- **Backend API** : Port 3001  
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

### 2. ✅ Les secrets sont déjà configurés

Le fichier `.env` avec JWT_SECRET et SESSION_SECRET a été **généré automatiquement** pour vous !

### 3. (Optionnel) Ajouter votre clé API Basketball

Si vous voulez des données réelles au lieu des exemples :

```bash
# Éditer .env et remplacer la ligne vide par :
API_BASKETBALL_KEY=votre_cle_rapidapi_ici
```

### 4. Construire et lancer

```bash
# Construire les images
docker-compose build

# Lancer tous les services
docker-compose up -d
```

### 5. Récupérer le mot de passe admin

```bash
docker-compose logs backend | grep "Mot de passe"
```

**Note** : Le mot de passe admin a déjà été généré précédemment : `64b1a1e2c89e2141`

### 6. Accéder à l'application

- **Frontend** : http://localhost:4000
- **Backend API** : http://localhost:3001/api
- **Login** : admin@basket.fr / `64b1a1e2c89e2141`

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

## 📁 Structure des Fichiers

```
.
├── backend/
│   ├── Dockerfile          # ✅ OpenSSL + Prisma
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
├── frontend/
│   ├── Dockerfile          # ✅ Serve (pas nginx)
│   ├── .env.production     # Config production
│   └── src/
├── docker-compose.yml      # ✅ Ports 4000, 3001, 4532
├── .env                    # ⚠️ Ne pas commiter (secrets)
└── .env.docker            # Template

```

## 🔒 Sécurité

### ✅ Sécurité Intégrée

1. **JWT_SECRET & SESSION_SECRET** : Générés automatiquement (64 caractères hex)
2. **Mot de passe admin** : Généré aléatoirement au premier démarrage
3. **Fichier .env** : Automatiquement ajouté à `.gitignore`

### ⚠️ Actions Recommandées

1. **Changer le mot de passe admin** après la première connexion
2. **Régénérer les secrets en production** si nécessaire
3. **Configurer HTTPS** en production avec un reverse proxy (nginx, Caddy, Traefik)
4. **Ne jamais commiter** le fichier `.env`

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

- [ ] Network Docker créé (`docker network create nginx_default`)
- [ ] Fichier `.env` vérifié (secrets générés automatiquement ✅)
- [ ] (Optionnel) Clé API Basketball configurée
- [ ] Images Docker construites (`docker-compose build`)
- [ ] Services démarrés (`docker-compose up -d`)
- [ ] Logs vérifiés (`docker-compose logs`)
- [ ] Connexion frontend testée (http://localhost:4000)
- [ ] API backend testée (http://localhost:3001/api/health)
- [ ] Mot de passe admin changé après première connexion

**Votre application est prête ! 🎉**
