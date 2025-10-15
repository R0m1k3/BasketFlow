# 🐳 Déploiement Docker - Guide Rapide

## 1. Créer le network nginx_default

```bash
docker network create nginx_default
```

## 2. Configurer les secrets

```bash
# Copier le template
cp .env.docker .env

# Générer les secrets automatiquement
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))" >> .env
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))" >> .env
```

## 3. Lancer Docker Compose

```bash
docker-compose up -d
```

## 4. Récupérer le mot de passe admin

```bash
docker-compose logs backend | grep "Mot de passe"
```

Notez le mot de passe affiché !

## 5. Accéder à l'application

- Frontend: http://localhost:4000
- Backend: http://localhost:3001
- PostgreSQL: Port 4532

Login: admin@basket.fr / mot-de-passe-généré

## Ports utilisés

- **4000** : Frontend React
- **3001** : Backend API
- **4532** : PostgreSQL (au lieu de 5432 pour éviter les conflits)

## Commandes utiles

```bash
# Voir les logs
docker-compose logs -f

# Redémarrer
docker-compose restart

# Arrêter
docker-compose down

# Arrêter et supprimer les données
docker-compose down -v
```
