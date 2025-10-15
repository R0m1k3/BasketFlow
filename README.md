# 🏀 Application Matchs de Basket - France

Application web affichant les matchs de basket de la semaine diffusés en France avec calendrier mensuel.

## 📋 Fonctionnalités

- **Tableau des matchs de la semaine** : NBA, WNBA, Euroleague, Eurocup, BCL, Betclic Elite
- **Calendrier mensuel interactif** : Tous les matchs connus et prévus
- **Chaînes de diffusion** : beIN Sports, Prime Video, La Chaîne L'Équipe, DAZN, SKWEEK, etc.
- **Mise à jour journalière automatique** : Synchronisation quotidienne avec les APIs
- **Filtres** : Par ligue et par chaîne de diffusion

## 🚀 Installation avec Docker

### Prérequis

- Docker et Docker Compose installés
- Network Docker `nginx_default` créé
- Clé API Basketball (API-Basketball.com ou Sportradar)

### Étapes d'installation

1. **Cloner le projet** :
```bash
git clone <votre-repo>
cd basket-app
```

2. **Créer le network Docker** (si non existant) :
```bash
docker network create nginx_default
```

3. **Configurer les variables d'environnement** :
```bash
cp .env.example .env
# Éditer .env et ajouter votre API_BASKETBALL_KEY
```

4. **Lancer l'application** :
```bash
docker-compose up -d
```

5. **Accéder à l'application** :
- Frontend : http://localhost:5000
- Backend API : http://localhost:3000

### Commandes utiles

```bash
# Voir les logs
docker-compose logs -f

# Arrêter l'application
docker-compose down

# Reconstruire les images
docker-compose build

# Accéder à la base de données
docker exec -it basket_postgres psql -U basketuser -d basketdb
```

## 🏗️ Architecture

```
.
├── backend/              # API Node.js/Express
│   ├── src/
│   │   ├── routes/      # Routes API
│   │   ├── services/    # Services métier
│   │   ├── cron/        # Jobs de mise à jour
│   │   └── prisma/      # Schéma base de données
│   └── Dockerfile
├── frontend/            # Application React
│   ├── src/
│   │   ├── components/  # Composants React
│   │   ├── pages/       # Pages
│   │   └── services/    # Services API
│   ├── nginx.conf
│   └── Dockerfile
└── docker-compose.yml   # Configuration Docker
```

## 📊 Base de données

PostgreSQL avec les tables :
- `matches` : Matchs de basket
- `leagues` : Ligues (NBA, Euroleague, etc.)
- `broadcasters` : Chaînes de diffusion
- `teams` : Équipes

## 🔄 Mise à jour journalière

Un cron job s'exécute quotidiennement à 6h00 pour :
1. Récupérer les nouveaux matchs depuis l'API
2. Mettre à jour les informations de diffusion
3. Nettoyer les matchs passés (>7 jours)

## 🛠️ Développement local

Pour développer sans Docker :

```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npm run dev

# Frontend
cd frontend
npm install
npm start
```

## 📝 APIs utilisées

- **API-Basketball** ou **Sportradar** : Données des matchs
- Mapping manuel des chaînes de diffusion françaises

## 🌐 Chaînes de diffusion supportées

- **NBA** : Prime Video (2025-26), beIN Sports (2024-25)
- **Euroleague** : La Chaîne L'Équipe, SKWEEK, EuroLeague TV
- **Betclic Elite** : DAZN, La Chaîne L'Équipe
- **WNBA** : beIN Sports, NBA League Pass

## 📄 Licence

MIT
