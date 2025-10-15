# 🏀 Installation - Application Matchs de Basket

## Prérequis

- Docker et Docker Compose installés
- Network Docker `nginx_default` créé (ou modifiez docker-compose.yml)
- Clé API Basketball de RapidAPI (optionnel, pour les données en direct)

## 🐳 Installation Docker (Recommandée)

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

Éditez `.env` et ajoutez votre clé RapidAPI :
```
API_BASKETBALL_KEY=votre_cle_ici
```

Sans clé API, l'application utilisera des données d'exemple.

### 4. Lancer l'application

```bash
docker-compose up -d
```

### 5. Récupérer le mot de passe admin

Le mot de passe admin est généré automatiquement au premier démarrage :

```bash
docker-compose logs backend | grep "Mot de passe"
```

Vous verrez quelque chose comme :
```
   🔑 Mot de passe: a1b2c3d4e5f6g7h8
```

### 6. Accéder à l'application

- **Frontend** : http://localhost:5000
- **Backend API** : http://localhost:3000
- **PostgreSQL** : Port 4532 (externe)

**Identifiants de connexion** :
- Email: `admin@basket.fr`
- Mot de passe: (celui affiché dans les logs)

---

## 💻 Installation Replit (Développement)

## Installation Rapide

### 1. Créer le network Docker

```bash
docker network create nginx_default
```

### 2. Cloner et configurer le projet

```bash
git clone <votre-repo>
cd basket-app
```

### 3. Configuration Backend

```bash
cd backend
cp .env.example .env
```

Éditez `backend/.env` et configurez les variables :

#### JWT_SECRET (OBLIGATOIRE) 🔒

Générez un secret aléatoire sécurisé :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copiez le résultat dans `.env` :
```
JWT_SECRET=<le-secret-généré>
```

#### SESSION_SECRET (OBLIGATOIRE) 🔒

Générez un autre secret :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Ajoutez-le dans `.env` :
```
SESSION_SECRET=<le-secret-généré>
```

#### API_BASKETBALL_KEY (Optionnel)

Si vous avez une clé API Basketball de RapidAPI, ajoutez-la :
```
API_BASKETBALL_KEY=votre_cle_rapidapi
```

Sans clé API, l'application utilisera des données d'exemple.

### 4. Initialiser la base de données et créer l'admin

```bash
npm install
npx prisma generate
npx prisma db push
npm run init-admin
```

**⚠️ IMPORTANT** : Le script affichera le mot de passe admin généré UNE SEULE FOIS :

```
✅ Administrateur créé avec succès !

   📧 Email: admin@basket.fr
   🔑 Mot de passe: a1b2c3d4e5f6g7h8

   ⚠️  IMPORTANT: Notez ce mot de passe et changez-le après votre première connexion !
```

**Notez ce mot de passe immédiatement !** Il ne sera plus affiché.

### 5. Lancer avec Docker

```bash
cd ..
docker-compose up -d
```

### 6. Accéder à l'application

- **Frontend** : http://localhost:5000
- **Backend API** : http://localhost:3000

## Première Connexion

1. Accédez à http://localhost:5000
2. Cliquez sur "Connexion"
3. Utilisez les identifiants :
   - Email: `admin@basket.fr`
   - Mot de passe: (celui affiché lors de l'init-admin)
4. **CHANGEZ IMMÉDIATEMENT LE MOT DE PASSE** dans le panneau admin

## Configuration Admin

Une fois connecté en tant qu'admin :

1. Cliquez sur "⚙️ Administration" dans le header
2. Configurez votre clé API Basketball si vous en avez une
3. Gérez les utilisateurs et leurs rôles

## Mise à jour journalière

La mise à jour des matchs s'effectue automatiquement tous les jours à 6h00.

Pour forcer une mise à jour manuelle :
```bash
cd backend
npm run seed
```

## Sécurité

### ⚠️ Points importants

1. **Ne JAMAIS commiter les fichiers .env** - Ils contiennent des secrets
2. **Changer le mot de passe admin** dès la première connexion
3. **Régénérer JWT_SECRET** si vous suspectez une compromission
4. **Utiliser HTTPS** en production
5. **Configurer un pare-feu** pour limiter l'accès aux ports

### Régénération des secrets

Si vous devez régénérer les secrets :

```bash
# Nouveau JWT_SECRET
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Nouveau SESSION_SECRET
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

Mettez à jour `.env`, puis redémarrez :
```bash
docker-compose restart
```

**⚠️ Attention** : Régénérer JWT_SECRET déconnectera tous les utilisateurs.

## Dépannage

### Le backend ne démarre pas

Vérifiez que JWT_SECRET est défini :
```bash
cd backend
grep JWT_SECRET .env
```

### L'admin n'existe pas

Recréez-le :
```bash
cd backend
npm run init-admin
```

### La base de données est vide

Seedez les données :
```bash
cd backend
npm run seed
```

## Support

Pour plus d'aide, consultez le README.md principal.
