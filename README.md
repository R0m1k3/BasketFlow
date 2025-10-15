# 🏀 Application Matchs de Basket - France

Application web affichant les matchs de basketball diffusés en France avec calendrier mensuel et vue hebdomadaire.

## 📋 Fonctionnalités

- **Ligues supportées** : NBA, WNBA, Euroleague, EuroCup, BCL, Betclic Elite
- **Chaînes de diffusion** : beIN Sports, Prime Video, La Chaîne L'Équipe, DAZN, SKWEEK, etc.
- **Mise à jour journalière automatique** : Synchronisation quotidienne avec les APIs
- **Filtres** : Par ligue et par chaîne de diffusion

## 🚀 Installation avec Docker

### ⚠️ Sécurité Important

**Ne JAMAIS commiter les fichiers `.env` contenant des secrets !** 

Voir [INSTALLATION.md](INSTALLATION.md) pour le guide complet et sécurisé.

### Étapes Rapides

1. **Créer le network Docker** :
```bash
docker network create nginx_default
```

2. **Configurer les secrets** :
```bash
cd backend
cp .env.example .env
# Générer JWT_SECRET
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))" >> .env
# Générer SESSION_SECRET  
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))" >> .env
```

3. **Lancer avec Docker** :
```bash
cd ..
docker-compose up -d
```

4. **Accéder à l'application** :
- Frontend : http://localhost:4000
- Backend API : http://localhost:3000
- PostgreSQL : Port 4532 (au lieu de 5432 pour éviter les conflits)

**Note** : Le compte admin sera créé automatiquement au premier démarrage. Consultez les logs pour obtenir le mot de passe :

```bash
docker-compose logs backend | grep "Mot de passe"
```

📖 **Guide complet** : Voir [INSTALLATION.md](INSTALLATION.md)

## 🔧 Développement sur Replit

### Configuration Backend

```bash
cd backend
cp .env.example .env
# Configurer les variables d'environnement
npm install
npx prisma generate
npx prisma db push
npm run init-admin
```

### Démarrer l'application

L'application utilise les workflows Replit :
- **Backend** : Port 3000
- **Frontend** : Port 5000 (obligatoire pour la preview Replit)

### Commandes utiles

```bash
# Mettre à jour les matchs manuellement
cd backend && npm run seed

# Initialiser/réinitialiser l'admin
cd backend && npm run init-admin

# Voir les logs
docker-compose logs -f
```

## 🏗️ Architecture

### Stack Technique

- **Frontend** : React, FullCalendar, Axios
- **Backend** : Node.js, Express, Prisma ORM
- **Base de données** : PostgreSQL
- **Authentification** : JWT avec rôles user/admin
- **Conteneurisation** : Docker & Docker Compose

### Structure

```
.
├── backend/
│   ├── src/
│   │   ├── server.js          # Serveur Express
│   │   ├── routes/            # Routes API
│   │   ├── middleware/        # Auth, logging
│   │   ├── services/          # updateService
│   │   └── initAdmin.js       # Init admin
│   ├── prisma/
│   │   └── schema.prisma      # Schéma base de données
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   └── context/           # AuthContext
│   └── Dockerfile
├── docker-compose.yml
└── INSTALLATION.md

```

## 🔐 Sécurité

### Variables d'environnement requises

- `JWT_SECRET` : **Obligatoire** - Secret pour signer les tokens JWT
- `SESSION_SECRET` : **Obligatoire** - Secret pour les sessions Express
- `API_BASKETBALL_KEY` : Optionnel - Clé API RapidAPI (utilise données d'exemple si absent)
- `DATABASE_URL` : URL de connexion PostgreSQL

### Bonnes pratiques

1. ✅ Générer des secrets aléatoires (32+ caractères)
2. ✅ Ne jamais commiter les fichiers `.env`
3. ✅ Changer le mot de passe admin après la première connexion
4. ✅ Utiliser HTTPS en production
5. ✅ Configurer un pare-feu

## 📊 API Basketball

L'application peut utiliser [API-Basketball](https://rapidapi.com/api-sports/api/api-basketball) pour récupérer les données en direct.

Sans clé API, l'application fonctionne avec des données d'exemple.

Configuration via le panneau d'administration après connexion.

## 🐳 Déploiement Docker

### Prérequis

- Docker et Docker Compose installés
- Network `nginx_default` créé
- Secrets configurés dans `.env`

### Lancement

```bash
# Créer le network
docker network create nginx_default

# Configurer les secrets (voir étapes ci-dessus)

# Démarrer tous les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f

# Arrêter les services
docker-compose down
```

### Ports

- **Frontend** : 5000
- **Backend** : 3000
- **PostgreSQL** : 4532 (externe) / 5432 (interne conteneur)

## 📝 Licence

MIT

## 🤝 Support

Pour toute question, consultez [INSTALLATION.md](INSTALLATION.md)
