# 🚀 DÉPLOIEMENT SUR SERVEUR PRIVÉ - BASKET FLOW

## ✅ CORRECTIONS APPLIQUÉES

### 1. Erreur TypeScript `.map is not a function` - **CORRIGÉ**
- ✅ Protection ajoutée dans `WeeklyMatches.js`
- ✅ Protection ajoutée dans `MonthlyCalendar.js`
- ✅ Vérification que `response.data` est un tableau
- ✅ Gestion des erreurs avec tableau vide par défaut

### 2. Configuration Docker - **CORRIGÉ**
- ✅ Tous les services sur réseau externe `nginx_default`
- ✅ Ports configurés : PostgreSQL 4532, Backend 3888, Frontend 4000
- ✅ JWT_SECRET et SESSION_SECRET intégrés dans docker-compose.yml
- ✅ Build npm utilise `npm install --production` (plus tolérant)
- ✅ Dépendances complètes : xml2js, @google/generative-ai, connect-pg-simple

---

## 📋 PRÉREQUIS

Sur votre serveur privé, vérifiez :

```bash
# 1. Docker installé
docker --version

# 2. Docker Compose installé
docker-compose --version

# 3. Réseau nginx_default existe
docker network ls | grep nginx_default

# 4. Si le réseau n'existe pas, le créer :
docker network create nginx_default
```

---

## 🚀 DÉPLOIEMENT COMPLET

### Étape 1 : Cloner/Transférer le Projet

```bash
# Sur votre serveur
cd /chemin/vers/vos/projets
git clone <votre-repo> basket-flow
# OU transférer les fichiers via scp/rsync
cd basket-flow
```

### Étape 2 : Nettoyer les Conteneurs Existants

```bash
# Arrêter et supprimer les anciens conteneurs
docker-compose down -v

# Nettoyer les images (optionnel)
docker system prune -a -f
```

### Étape 3 : Reconstruire les Images

```bash
# Reconstruire sans cache
docker-compose build --no-cache

# Vérifier que les images sont créées
docker images | grep basket
```

### Étape 4 : Démarrer les Services

```bash
# Démarrer en arrière-plan
docker-compose up -d

# Vérifier le statut
docker-compose ps
```

### Étape 5 : Vérifier les Logs

```bash
# Logs du backend
docker-compose logs -f backend

# Logs du frontend
docker-compose logs -f frontend

# Tous les logs
docker-compose logs -f
```

---

## ✅ RÉSULTAT ATTENDU

### Backend
```
✅ JWT_SECRET est configuré
✅ Administrateur créé avec succès !
   👤 Identifiant: admin
   🔑 Mot de passe: admin
✅ Configurations API initialisées (Basketball Data + Gemini)
🏀 Backend server running on port 3888
📅 Daily updates scheduled at 6:00 AM
```

### Frontend
```
Compiled successfully!
You can now view basket-frontend in the browser.
  Local:            http://localhost:4000
```

---

## 🌐 CONFIGURATION NGINX (Reverse Proxy)

### Configuration recommandée

Créez un fichier `/etc/nginx/sites-available/basket-flow` :

```nginx
server {
    listen 80;
    server_name basket.votredomaine.fr;  # Remplacer par votre domaine

    # Frontend
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3888;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Activer la configuration

```bash
# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/basket-flow /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Recharger nginx
sudo systemctl reload nginx
```

---

## 🔒 HTTPS avec Let's Encrypt (Optionnel)

```bash
# Installer certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir le certificat SSL
sudo certbot --nginx -d basket.votredomaine.fr

# Renouvellement automatique
sudo certbot renew --dry-run
```

---

## 🔍 VÉRIFICATION

### Tester les endpoints

```bash
# Health check backend
curl http://localhost:3888/health

# Récupérer les matchs de la semaine
curl http://localhost:3888/api/matches/week

# Vérifier le frontend
curl http://localhost:4000
```

### Vérifier le réseau nginx_default

```bash
docker network inspect nginx_default
```

Vous devriez voir :
- `basket_frontend`
- `basket_backend`
- `basket_postgres`
- (vos autres conteneurs)

---

## 🐛 DÉPANNAGE

### Problème : Erreur "network nginx_default not found"

```bash
# Créer le réseau
docker network create nginx_default

# Redémarrer
docker-compose up -d
```

### Problème : Build npm échoue

```bash
# Vérifier les dépendances
cd backend
cat package.json

# Build détaillé
docker-compose build --no-cache --progress=plain backend 2>&1 | tee build.log
```

### Problème : Frontend affiche "r.map is not a function"

```bash
# Reconstruire le frontend
docker-compose build --no-cache frontend
docker-compose restart frontend

# Vérifier les logs
docker-compose logs -f frontend
```

### Problème : PostgreSQL ne démarre pas

```bash
# Vérifier le port 4532
sudo netstat -tulpn | grep 4532

# Supprimer les volumes et recréer
docker-compose down -v
docker-compose up -d
```

### Problème : Backend ne se connecte pas à PostgreSQL

```bash
# Vérifier la connexion
docker exec basket_backend ping -c 2 basket_postgres

# Vérifier les variables d'environnement
docker exec basket_backend env | grep DATABASE_URL
```

---

## 📊 MONITORING

### Voir l'utilisation des ressources

```bash
# Stats en temps réel
docker stats basket_frontend basket_backend basket_postgres

# Espace disque
docker system df
```

### Logs persistants

```bash
# Configuration dans docker-compose.yml (déjà fait)
# Les logs sont dans /var/lib/docker/containers/
```

---

## 🔄 MISES À JOUR

### Mettre à jour l'application

```bash
# 1. Récupérer les dernières modifications
git pull origin main

# 2. Reconstruire
docker-compose build --no-cache

# 3. Redémarrer
docker-compose up -d

# 4. Vérifier
docker-compose logs -f
```

---

## 📋 COMMANDES UTILES

```bash
# Arrêter tous les services
docker-compose down

# Supprimer tout (conteneurs + volumes)
docker-compose down -v

# Voir les logs en temps réel
docker-compose logs -f

# Redémarrer un service
docker-compose restart backend

# Entrer dans un conteneur
docker exec -it basket_backend sh

# Sauvegarder la base de données
docker exec basket_postgres pg_dump -U basketuser basketdb > backup.sql

# Restaurer la base de données
cat backup.sql | docker exec -i basket_postgres psql -U basketuser basketdb
```

---

## ✅ CHECKLIST DE DÉPLOIEMENT

- [ ] Réseau `nginx_default` existe
- [ ] Variables d'environnement configurées dans docker-compose.yml
- [ ] Images Docker construites sans erreur
- [ ] Conteneurs démarrés (postgres, backend, frontend)
- [ ] Backend affiche "Backend server running on port 3888"
- [ ] Frontend compile sans erreur
- [ ] Nginx configuré (si applicable)
- [ ] SSL configuré (si applicable)
- [ ] Tests des endpoints API fonctionnent
- [ ] Accès frontend fonctionne

---

## 📞 SUPPORT

### Logs détaillés pour diagnostic

```bash
# Sauvegarder tous les logs
docker-compose logs > basket-flow-logs.txt

# Inspecter la configuration
docker-compose config > docker-config.yml

# Vérifier la santé de PostgreSQL
docker exec basket_postgres pg_isready -U basketuser -d basketdb -p 4532
```

---

## 🎉 ACCÈS FINAL

**Une fois déployé avec succès :**

- **Frontend** : http://basket.votredomaine.fr (via nginx)
- **Backend API** : http://basket.votredomaine.fr/api (via nginx)
- **Login Admin** : admin / admin

**En local (sans nginx) :**

- **Frontend** : http://localhost:4000
- **Backend** : http://localhost:3888

---

## 🔐 SÉCURITÉ POST-DÉPLOIEMENT

⚠️ **À FAIRE IMMÉDIATEMENT** :

1. **Changer le mot de passe admin**
   ```bash
   # Se connecter à l'interface admin
   # Aller dans Paramètres → Changer le mot de passe
   ```

2. **Configurer un pare-feu**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **Configurer des sauvegardes automatiques**
   ```bash
   # Créer un cron job pour pg_dump
   crontab -e
   # Ajouter : 0 3 * * * docker exec basket_postgres pg_dump -U basketuser basketdb > /backups/basket-$(date +\%Y\%m\%d).sql
   ```

🎉 **Votre application Basket Flow est maintenant déployée !**
