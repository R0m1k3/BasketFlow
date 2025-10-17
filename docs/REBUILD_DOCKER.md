# 🔧 RECONSTRUCTION DOCKER - Dépendances Manquantes

## ❌ Problème

```
Error: Cannot find module 'xml2js'
```

## ✅ Solution Appliquée

J'ai ajouté les dépendances manquantes dans `backend/package.json` :
- ✅ `xml2js` - Parser XML pour Euroleague
- ✅ `@google/generative-ai` - Gemini AI
- ✅ `connect-pg-simple` - Sessions PostgreSQL

## 🚀 RECONSTRUCTION IMMÉDIATE

**Sur votre serveur, exécutez ces commandes :**

```bash
# 1. Arrêter les conteneurs
docker-compose down

# 2. Reconstruire le backend avec les nouvelles dépendances
docker-compose build --no-cache backend

# 3. Redémarrer tous les services
docker-compose up -d

# 4. Vérifier les logs
docker-compose logs -f backend
```

---

## ✅ Résultat Attendu

Le backend devrait maintenant démarrer sans erreur :

```
✅ JWT_SECRET est configuré
✅ Administrateur créé avec succès !
   👤 Identifiant: admin
   🔑 Mot de passe: admin
✅ Configurations API initialisées (Basketball Data + Gemini)
🏀 Backend server running on port 3888
📅 Daily updates scheduled at 6:00 AM
```

---

## 🔍 Vérification des Dépendances

Pour vérifier que xml2js est bien installé dans le conteneur :

```bash
docker exec basket_backend npm list xml2js
```

**Devrait afficher :**
```
basket-backend@1.0.0 /app
└── xml2js@0.6.2
```

---

## 🆘 Si le Problème Persiste

### Option 1 : Reconstruction complète
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Option 2 : Vérifier les logs de build
```bash
docker-compose build backend 2>&1 | grep -i "xml2js\|error"
```

### Option 3 : Installer manuellement dans le conteneur (temporaire)
```bash
docker exec basket_backend npm install xml2js @google/generative-ai connect-pg-simple
docker-compose restart backend
```

---

## 📋 Dépendances Backend Complètes

```json
{
  "@google/generative-ai": "^0.21.0",
  "@prisma/client": "^5.7.1",
  "axios": "^1.6.2",
  "bcryptjs": "^3.0.2",
  "cheerio": "^1.1.2",
  "connect-pg-simple": "^10.0.0",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "express": "^4.18.2",
  "express-session": "^1.18.2",
  "jsonwebtoken": "^9.0.2",
  "node-cron": "^3.0.3",
  "openai": "^6.3.0",
  "xml2js": "^0.6.2"
}
```

---

## ✅ Accès Application

Une fois le backend démarré :

- **Frontend** : http://localhost:4000
- **Backend** : http://localhost:3888
- **Login** : admin / admin

🎉 **Votre application devrait maintenant fonctionner complètement !**
