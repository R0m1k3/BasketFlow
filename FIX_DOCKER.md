# 🔧 CORRECTION URGENTE - Docker Basket Flow

## ❌ Problème Actuel

1. **JWT_SECRET non reconnu** par le backend Docker
2. **Conflit avec votre autre application** à cause du réseau partagé `nginx_default`

## ✅ SOLUTION COMPLÈTE

### Étape 1 : Créer le Fichier `.env` Correct

**Sur votre serveur, à la racine du projet Basket Flow**, créez/modifiez le fichier `.env` :

```bash
# Créer le fichier .env avec les bonnes valeurs
cat > .env << 'EOF'
# Configuration Docker - Basketball App

# Secrets de sécurité (OBLIGATOIRES)
JWT_SECRET=9e4460d833531cb04286f0ba350e989d5afb8affb31513e8e779d44c35ad9548
SESSION_SECRET=6073693be610363a5862503445a4cf38fb391efbe502526fa9036902759a4819

# API Basketball (optionnel)
API_BASKETBALL_KEY=

# Environnement
NODE_ENV=production
PORT=3888
EOF
```

### Étape 2 : Arrêter les Anciens Conteneurs

```bash
# Arrêter tous les conteneurs basket
docker-compose down

# Supprimer les volumes (efface les données - normal pour recréer)
docker-compose down -v
```

### Étape 3 : Redémarrer avec la Nouvelle Configuration

```bash
# Reconstruire sans cache
docker-compose build --no-cache

# Démarrer les services
docker-compose up -d

# Vérifier les logs
docker-compose logs -f backend
```

---

## 🔍 Vérification

### ✅ Le Backend Doit Afficher :

```
✅ JWT_SECRET est configuré
✅ Administrateur créé avec succès !
   👤 Identifiant: admin
   🔑 Mot de passe: admin
🏀 Backend server running on port 3888
```

### ❌ Si Vous Voyez Encore "JWT_SECRET n'est pas défini" :

**Vérifiez que le fichier .env existe :**
```bash
ls -la .env
cat .env
```

**Vérifiez les variables dans le conteneur :**
```bash
docker exec basket_backend env | grep JWT_SECRET
```

---

## 🐘 Résolution du Conflit PostgreSQL

### Changement Important

**AVANT** (causait le conflit) :
- Réseau partagé : `nginx_default` (utilisé par votre autre app)
- Conteneur PostgreSQL : nommé `postgres` (conflit avec autre app)

**MAINTENANT** (isolé) :
- Réseau dédié : `basket_network` (séparé de nginx_default)
- Conteneur PostgreSQL : nommé `basket_postgres` (unique)
- Volume : `basket_postgres_data` (données isolées)

### Votre Autre Application

**Votre autre application continuera de fonctionner normalement** car :
- Elle utilise toujours le réseau `nginx_default`
- Elle cherche un conteneur nommé `postgres` (pas `basket_postgres`)
- Basket Flow est maintenant complètement isolé sur son propre réseau

---

## 📋 Ports Finaux

| Service | Port Interne | Port Externe | Réseau |
|---------|-------------|--------------|--------|
| Frontend | 4000 | 4000 | basket_network |
| Backend | 3888 | 3888 | basket_network |
| PostgreSQL | 4532 | 4532 | basket_network |

**Les deux applications sont maintenant isolées et ne se gênent plus !**

---

## 🆘 Commandes de Dépannage

### Vérifier les Réseaux Docker
```bash
# Voir tous les réseaux
docker network ls

# Inspecter le réseau basket
docker network inspect basket_network

# Inspecter nginx_default (votre autre app)
docker network inspect nginx_default
```

### Vérifier les Conteneurs
```bash
# Conteneurs basket flow
docker ps | grep basket

# Tous les conteneurs PostgreSQL
docker ps | grep postgres
```

### Voir les Logs Détaillés
```bash
# Backend
docker logs basket_backend --tail=100

# PostgreSQL
docker logs basket_postgres --tail=50

# Tous ensemble
docker-compose logs --tail=50
```

### Test de Connexion PostgreSQL
```bash
# Depuis l'hôte
docker exec basket_postgres pg_isready -U basketuser -d basketdb -p 4532

# Connexion SQL
docker exec -it basket_postgres psql -U basketuser -d basketdb -p 4532
```

---

## ✅ Checklist de Résolution

- [ ] 1. Fichier `.env` créé à la racine avec JWT_SECRET et SESSION_SECRET
- [ ] 2. `docker-compose down -v` exécuté
- [ ] 3. `docker-compose build --no-cache` exécuté
- [ ] 4. `docker-compose up -d` exécuté
- [ ] 5. Backend affiche "✅ JWT_SECRET est configuré"
- [ ] 6. Backend démarre sur port 3888 sans erreur
- [ ] 7. L'autre application fonctionne toujours normalement
- [ ] 8. Aucun conflit PostgreSQL

---

## 🎯 Résultat Attendu

**Basket Flow :**
- Frontend : http://localhost:4000
- Backend : http://localhost:3888
- PostgreSQL : localhost:4532
- Réseau : `basket_network` (isolé)

**Votre Autre Application :**
- Continue de fonctionner sur `nginx_default`
- Continue d'utiliser son PostgreSQL sur port 5432
- Aucune interférence avec Basket Flow

**Les deux applications fonctionnent maintenant en parallèle sans conflit ! 🎉**
