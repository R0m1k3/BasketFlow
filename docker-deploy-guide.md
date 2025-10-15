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

### 2. Configurer les secrets

```bash
# Copier le template
cp .env.docker .env

# Générer JWT_SECRET
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env

# Générer SESSION_SECRET
echo "SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" >> .env
```

### 3. (Optionnel) Ajouter votre clé API Basketball

```bash
# Éditer .env et ajouter :
API_BASKETBALL_KEY=votre_cle_rapidapi
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

### 6. Accéder à l'application

- **Frontend** : http://localhost:4000
- **Backend API** : http://localhost:3001
- **Login** : admin@basket.fr / (mot de passe généré)

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

### Le backend ne trouve pas le schéma Prisma
✅ Corrigé - Le Dockerfile copie maintenant prisma/ avant de générer le client

### Erreur "port already allocated"
✅ Corrigé - Tous les ports Docker sont différents des ports Replit

### Le frontend ne se connecte pas au backend
- Vérifiez que les services sont sur le même network (`nginx_default`)
- Le frontend appelle `/api` qui est proxifié vers le backend

### Voir l'état des conteneurs
```bash
docker-compose ps
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

1. Ne jamais commiter `.env`
2. Régénérer les secrets en production
3. Changer le mot de passe admin après la première connexion
4. Configurer HTTPS en production avec un reverse proxy
