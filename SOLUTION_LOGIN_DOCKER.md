# 🔐 SOLUTION LOGIN - Configuration pour Docker

## 🎯 LE PROBLÈME

Sur votre serveur Docker, le frontend ne peut pas se connecter au backend car ils sont sur des ports différents et dans des conteneurs séparés.

## ✅ LA SOLUTION

J'ai créé une configuration API centralisée qui s'adapte automatiquement :
- **Sur Replit** : Utilise le proxy (backend sur port 3000)
- **Sur Docker** : Utilise l'URL directe (backend sur port 3888)

---

## 📦 FICHIERS MODIFIÉS

### 1. **frontend/src/api/config.js** (NOUVEAU)
Configuration centralisée de l'API avec gestion automatique des tokens

### 2. **frontend/src/context/AuthContext.js**
Utilise maintenant la configuration API centralisée au lieu d'axios direct

### 3. **frontend/.env**
Vide pour Replit (utilise le proxy)

### 4. **frontend/.env.production**
Configuration pour Docker :
```
REACT_APP_API_URL=http://localhost:3888/api
```

### 5. **docker-compose.yml**
Passe la variable d'environnement au frontend :
```yaml
frontend:
  environment:
    REACT_APP_API_URL: http://localhost:3888/api
```

---

## 🚀 INSTRUCTIONS POUR VOTRE SERVEUR DOCKER

### **Étape 1 : Transférer les fichiers modifiés**
Copiez ces fichiers sur votre serveur :
- `frontend/src/api/config.js` (NOUVEAU)
- `frontend/src/context/AuthContext.js` (MODIFIÉ)
- `frontend/.env.production` (MODIFIÉ)
- `docker-compose.yml` (MODIFIÉ)

### **Étape 2 : Nettoyer et reconstruire**
```bash
cd /chemin/vers/basket-flow

# Arrêter et nettoyer
docker-compose down

# Reconstruire (important pour prendre en compte les nouveaux fichiers)
docker-compose build --no-cache

# Démarrer
docker-compose up -d
```

### **Étape 3 : Vérifier les logs**
```bash
# Backend
docker-compose logs backend | tail -20

# Frontend
docker-compose logs frontend | tail -20
```

### **Étape 4 : Tester le login**
1. Ouvrez **http://localhost:4000/login**
2. Entrez :
   - Username : **admin**
   - Password : **admin**
3. Cliquez sur "Se connecter"

---

## 🔍 VÉRIFICATION DU CORS

Le backend doit autoriser les requêtes depuis le frontend. Vérifiez dans `backend/src/server.js` :

```javascript
app.use(cors({
  origin: ['http://localhost:4000', 'http://localhost:5000'],
  credentials: true
}));
```

Si le CORS bloque, ajoutez cette configuration.

---

## 🆘 DÉPANNAGE

### Erreur "Network Error"
➜ Le frontend ne peut pas atteindre le backend
**Solution** :
1. Vérifiez que le backend écoute bien sur 0.0.0.0:3888 (pas juste localhost)
2. Vérifiez les logs backend : `docker-compose logs backend`
3. Testez manuellement : `curl http://localhost:3888/api/auth/me`

### Erreur "CORS policy"
➜ Le backend bloque les requêtes du frontend
**Solution** : Ajoutez le CORS dans `backend/src/server.js` :
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:4000', 'http://localhost:5000'],
  credentials: true
}));
```

### Le login ne fonctionne toujours pas
➜ Vérifiez que l'admin existe dans la base
```bash
docker-compose exec postgres psql -U basketuser -d basketdb -c "SELECT username, role FROM \"User\";"
```

Vous devez voir :
```
 username | role  
----------+-------
 admin    | admin
```

### L'URL API n'est pas bonne
➜ Vérifiez la variable d'environnement dans le conteneur frontend
```bash
docker-compose exec frontend env | grep REACT_APP
```

Vous devez voir :
```
REACT_APP_API_URL=http://localhost:3888/api
```

---

## 🎯 CONFIGURATION AVEC NGINX (Optionnel)

Si vous utilisez nginx comme reverse proxy, modifiez `.env.production` :

```bash
# Si nginx écoute sur le port 80 et redirige vers le backend
REACT_APP_API_URL=/api
```

Et configurez nginx pour router `/api/*` vers `http://basket_backend:3888/api/*`

---

## ✅ CHECKLIST DE VÉRIFICATION

Avant de tester :

- [ ] Le backend démarre sans erreur (vérifier les logs)
- [ ] Le frontend compile sans erreur (vérifier les logs)
- [ ] L'admin existe dans la base de données
- [ ] Le CORS est configuré sur le backend
- [ ] La variable REACT_APP_API_URL est définie
- [ ] Les ports 3888 et 4000 sont accessibles

---

## 🎉 RÉSULTAT ATTENDU

Après ces modifications :

✅ Le frontend peut appeler le backend  
✅ Le login fonctionne avec admin/admin  
✅ L'authentification JWT fonctionne  
✅ Les matchs s'affichent correctement  

**VOTRE APPLICATION SERA COMPLÈTEMENT FONCTIONNELLE ! 🚀**
