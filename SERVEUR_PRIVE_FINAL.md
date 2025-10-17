# 🎯 DÉPLOIEMENT SERVEUR PRIVÉ - GUIDE FINAL

## ✅ PROBLÈME RÉSOLU

**Erreur** : `TypeError: t.map is not a function` dans **FilterBar.js:11**

**Cause** : Les API `/api/leagues` et `/api/broadcasters` retournaient parfois un objet au lieu d'un tableau

**Solution** : Protection ajoutée dans 3 fichiers pour garantir que `.map()` fonctionne toujours avec des tableaux

---

## 📝 FICHIERS CORRIGÉS

### 1. ✅ `frontend/src/components/FilterBar.js`
- Vérification que `leagues` et `broadcasters` sont des tableaux
- Conversion automatique en tableau vide si données invalides

### 2. ✅ `frontend/src/pages/Home.js`
- Protection lors de la récupération des ligues
- Protection lors de la récupération des diffuseurs
- Tableau vide par défaut en cas d'erreur

### 3. ✅ `frontend/src/components/WeeklyMatches.js`
- Protection des données de matchs

### 4. ✅ `frontend/src/components/MonthlyCalendar.js`
- Protection des événements du calendrier

### 5. ✅ `docker-compose.yml`
- Tous les services sur réseau `nginx_default`

---

## 🚀 COMMANDES DE DÉPLOIEMENT

### Sur votre serveur privé, exécutez :

```bash
# 1. Aller dans le dossier du projet
cd /chemin/vers/basket-flow

# 2. Arrêter les conteneurs
docker-compose down

# 3. Récupérer les dernières modifications
# (Si vous utilisez Git)
git pull origin main

# (OU si vous transférez les fichiers manuellement)
# Assurez-vous que tous les fichiers modifiés sont à jour

# 4. Vérifier/créer le réseau nginx_default
docker network ls | grep nginx_default || docker network create nginx_default

# 5. Reconstruire UNIQUEMENT le frontend (les autres sont OK)
docker-compose build --no-cache frontend

# 6. Démarrer tous les services
docker-compose up -d

# 7. Vérifier les logs
docker-compose logs -f frontend
```

---

## ✅ RÉSULTAT ATTENDU

### Frontend devrait compiler sans erreur :
```
Compiling...
Compiled successfully!

You can now view basket-frontend in the browser.
  Local:            http://localhost:4000

webpack compiled successfully
```

### Backend devrait afficher :
```
✅ JWT_SECRET est configuré
✅ Administrateur créé avec succès !
🏀 Backend server running on port 3888
📅 Daily updates scheduled at 6:00 AM
```

---

## 🔍 VÉRIFICATION RAPIDE

### 1. Tester les API :

```bash
# Vérifier les ligues
curl http://localhost:3888/api/leagues

# Vérifier les diffuseurs
curl http://localhost:3888/api/broadcasters

# Vérifier les matchs
curl http://localhost:3888/api/matches/week
```

**Ces commandes doivent retourner des tableaux JSON**, par exemple :
```json
[
  {"id": "1", "name": "NBA", "shortName": "NBA"},
  {"id": "2", "name": "Euroleague", "shortName": "EL"}
]
```

### 2. Tester le Frontend :

Ouvrez votre navigateur : **http://localhost:4000**

Vous devriez voir :
- ✅ Page d'accueil avec les filtres (Ligue et Chaîne)
- ✅ Pas d'erreur dans la console du navigateur
- ✅ Les sélecteurs affichent les ligues et chaînes

---

## 🐛 DÉPANNAGE

### Si l'erreur `.map` persiste encore :

1. **Vérifier que les fichiers sont à jour :**
   ```bash
   # Vérifier FilterBar.js
   grep "Array.isArray" frontend/src/components/FilterBar.js
   
   # Vous devriez voir :
   # const leaguesList = Array.isArray(leagues) ? leagues : [];
   # const broadcastersList = Array.isArray(broadcasters) ? broadcasters : [];
   ```

2. **Vider le cache Docker et reconstruire :**
   ```bash
   docker-compose down -v
   docker system prune -a -f
   docker-compose build --no-cache
   docker-compose up -d
   ```

3. **Vérifier les logs frontend en détail :**
   ```bash
   docker-compose logs frontend | grep -i error
   ```

### Si les API retournent des objets au lieu de tableaux :

Vérifier le backend :

```bash
# Voir les routes
docker exec basket_backend cat src/routes/leagues.js
docker exec basket_backend cat src/routes/broadcasters.js
```

Les routes doivent retourner des tableaux :
```javascript
res.json(leagues); // leagues doit être un tableau
```

---

## 📋 LISTE DE VÉRIFICATION FINALE

Avant de considérer le déploiement terminé :

- [ ] Réseau `nginx_default` créé
- [ ] `docker-compose down` exécuté
- [ ] Fichiers mis à jour (git pull ou transfert manuel)
- [ ] `docker-compose build --no-cache frontend` réussi
- [ ] `docker-compose up -d` démarré
- [ ] Logs frontend : "Compiled successfully!"
- [ ] Logs backend : "Backend server running on port 3888"
- [ ] API `/api/leagues` retourne un tableau
- [ ] API `/api/broadcasters` retourne un tableau
- [ ] Frontend accessible sur :4000
- [ ] Pas d'erreur `.map is not a function` dans la console navigateur
- [ ] Filtres Ligue et Chaîne fonctionnels

---

## 🌐 CONFIGURATION NGINX (Optionnel)

Si vous souhaitez accéder via un nom de domaine :

```nginx
# /etc/nginx/sites-available/basket-flow
server {
    listen 80;
    server_name basket.votredomaine.fr;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3888;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activer :
```bash
sudo ln -s /etc/nginx/sites-available/basket-flow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔐 SÉCURITÉ

Après le déploiement :

1. **Changer le mot de passe admin**
   - Se connecter : http://localhost:4000/login
   - Identifiant : `admin`
   - Mot de passe : `admin`
   - Aller dans le panneau admin et changer le mot de passe

2. **Configurer le pare-feu**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

3. **Sauvegardes automatiques**
   ```bash
   # Créer un script de backup
   cat > /usr/local/bin/basket-backup.sh << 'EOF'
   #!/bin/bash
   docker exec basket_postgres pg_dump -U basketuser basketdb > /backups/basket-$(date +%Y%m%d).sql
   EOF
   
   chmod +x /usr/local/bin/basket-backup.sh
   
   # Ajouter au cron (tous les jours à 3h)
   echo "0 3 * * * /usr/local/bin/basket-backup.sh" | crontab -
   ```

---

## ✅ RÉCAPITULATIF DES CORRECTIONS

| Fichier | Problème | Solution |
|---------|----------|----------|
| FilterBar.js | `.map()` sur non-tableau | ✅ `Array.isArray()` ajouté |
| Home.js | API retourne objet | ✅ Vérification + tableau vide par défaut |
| WeeklyMatches.js | Données matches invalides | ✅ Protection ajoutée |
| MonthlyCalendar.js | Données events invalides | ✅ Protection ajoutée |
| docker-compose.yml | Réseau isolé | ✅ Changé en nginx_default |
| Dockerfile (backend) | npm ci échoue | ✅ Changé en npm install |

---

## 🎉 ACCÈS FINAL

**Après déploiement réussi :**

- **Frontend** : http://localhost:4000 ou http://basket.votredomaine.fr
- **Backend API** : http://localhost:3888/api
- **Login Admin** : admin / admin (à changer immédiatement !)

---

## 📞 SUPPORT RAPIDE

### Commande de diagnostic complète :

```bash
#!/bin/bash
echo "=== DIAGNOSTIC BASKET FLOW ==="
echo ""
echo "1. Réseau Docker :"
docker network inspect nginx_default | grep -A5 Containers
echo ""
echo "2. Statut des conteneurs :"
docker-compose ps
echo ""
echo "3. Logs Backend (dernières 20 lignes) :"
docker-compose logs --tail=20 backend
echo ""
echo "4. Logs Frontend (dernières 20 lignes) :"
docker-compose logs --tail=20 frontend
echo ""
echo "5. Test API Leagues :"
curl -s http://localhost:3888/api/leagues | jq .
echo ""
echo "6. Test API Broadcasters :"
curl -s http://localhost:3888/api/broadcasters | jq .
```

Sauvegardez ce script et exécutez-le pour un diagnostic complet.

---

🎉 **VOTRE APPLICATION EST PRÊTE À ÊTRE DÉPLOYÉE !**

Toutes les erreurs `.map is not a function` ont été corrigées dans tous les fichiers.
