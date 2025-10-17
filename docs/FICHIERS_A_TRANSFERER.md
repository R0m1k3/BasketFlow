# 📦 FICHIERS À TRANSFÉRER SUR VOTRE SERVEUR PRIVÉ

## ✅ FICHIERS MODIFIÉS (à transférer obligatoirement)

### 1. Frontend - Corrections erreur `.map is not a function`

```
frontend/src/components/FilterBar.js          (CRITIQUE - Corrigé ligne 11)
frontend/src/pages/Home.js                    (Protection API)
frontend/src/components/WeeklyMatches.js      (Protection données)
frontend/src/components/MonthlyCalendar.js    (Protection événements)
```

### 2. Backend - Corrections build Docker

```
backend/Dockerfile                            (npm install --production)
backend/package.json                          (dépendances ajoutées)
```

### 3. Docker - Configuration réseau

```
docker-compose.yml                            (Réseau nginx_default)
```

---

## 🚀 MÉTHODE 1 : TRANSFERT AVEC GIT

```bash
# Sur votre serveur
cd /chemin/vers/basket-flow
git pull origin main
```

---

## 🚀 MÉTHODE 2 : TRANSFERT MANUEL (SCP)

### Depuis votre machine locale vers le serveur :

```bash
# Créer un dossier temporaire
mkdir basket-flow-update
cd basket-flow-update

# Copier les fichiers modifiés (structure à respecter)
mkdir -p frontend/src/components
mkdir -p frontend/src/pages
mkdir -p backend

# Copier les fichiers
cp /chemin/local/frontend/src/components/FilterBar.js frontend/src/components/
cp /chemin/local/frontend/src/pages/Home.js frontend/src/pages/
cp /chemin/local/frontend/src/components/WeeklyMatches.js frontend/src/components/
cp /chemin/local/frontend/src/components/MonthlyCalendar.js frontend/src/components/
cp /chemin/local/backend/Dockerfile backend/
cp /chemin/local/backend/package.json backend/
cp /chemin/local/docker-compose.yml .

# Transférer vers le serveur
scp -r . user@votreserveur:/chemin/vers/basket-flow-update

# Sur le serveur, copier les fichiers
ssh user@votreserveur
cd /chemin/vers/basket-flow
cp -r ../basket-flow-update/* .
```

---

## 🚀 MÉTHODE 3 : TRANSFERT AVEC RSYNC

```bash
# Depuis votre machine locale
rsync -avz --include='*/' \
  --include='frontend/src/components/FilterBar.js' \
  --include='frontend/src/pages/Home.js' \
  --include='frontend/src/components/WeeklyMatches.js' \
  --include='frontend/src/components/MonthlyCalendar.js' \
  --include='backend/Dockerfile' \
  --include='backend/package.json' \
  --include='docker-compose.yml' \
  --exclude='*' \
  . user@votreserveur:/chemin/vers/basket-flow/
```

---

## 📋 CONTENU DES FICHIERS CRITIQUES

### ✅ FilterBar.js (LIGNE 5-6 AJOUTÉES)

```javascript
function FilterBar({ leagues, broadcasters, selectedLeague, selectedBroadcaster, onLeagueChange, onBroadcasterChange }) {
  // Ensure leagues and broadcasters are arrays
  const leaguesList = Array.isArray(leagues) ? leagues : [];
  const broadcastersList = Array.isArray(broadcasters) ? broadcasters : [];
  
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>Ligue:</label>
        <select value={selectedLeague} onChange={(e) => onLeagueChange(e.target.value)}>
          <option value="all">Toutes les ligues</option>
          {leaguesList.map(league => (  // LIGNE MODIFIÉE
            <option key={league.id} value={league.id}>{league.name}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Chaîne:</label>
        <select value={selectedBroadcaster} onChange={(e) => onBroadcasterChange(e.target.value)}>
          <option value="all">Toutes les chaînes</option>
          {broadcastersList.map(broadcaster => (  // LIGNE MODIFIÉE
            <option key={broadcaster.id} value={broadcaster.id}>
              {broadcaster.name} {broadcaster.isFree ? '📺' : '💰'}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
```

### ✅ Home.js (LIGNES 28, 31, 38, 41 MODIFIÉES)

```javascript
const fetchLeagues = async () => {
  try {
    const response = await axios.get('/api/leagues');
    setLeagues(Array.isArray(response.data) ? response.data : []);  // MODIFIÉ
  } catch (error) {
    console.error('Error fetching leagues:', error);
    setLeagues([]);  // AJOUTÉ
  }
};

const fetchBroadcasters = async () => {
  try {
    const response = await axios.get('/api/broadcasters');
    setBroadcasters(Array.isArray(response.data) ? response.data : []);  // MODIFIÉ
  } catch (error) {
    console.error('Error fetching broadcasters:', error);
    setBroadcasters([]);  // AJOUTÉ
  }
};
```

### ✅ docker-compose.yml (RÉSEAU MODIFIÉ)

```yaml
networks:
  nginx_default:
    external: true
```

Tous les services utilisent `nginx_default` :
```yaml
services:
  postgres:
    networks:
      - nginx_default
  backend:
    networks:
      - nginx_default
  frontend:
    networks:
      - nginx_default
```

### ✅ backend/Dockerfile (LIGNE 11 MODIFIÉE)

```dockerfile
RUN npm install --production  # Au lieu de npm ci --only=production
```

---

## 🔍 VÉRIFICATION APRÈS TRANSFERT

Sur votre serveur, vérifiez que les fichiers sont bien modifiés :

```bash
# Vérifier FilterBar.js
grep "Array.isArray" frontend/src/components/FilterBar.js

# Devrait afficher :
# const leaguesList = Array.isArray(leagues) ? leagues : [];
# const broadcastersList = Array.isArray(broadcasters) ? broadcasters : [];

# Vérifier Home.js
grep "Array.isArray" frontend/src/pages/Home.js

# Devrait afficher :
# setLeagues(Array.isArray(response.data) ? response.data : []);
# setBroadcasters(Array.isArray(response.data) ? response.data : []);

# Vérifier docker-compose.yml
grep "nginx_default" docker-compose.yml

# Devrait afficher plusieurs lignes avec nginx_default

# Vérifier Dockerfile
grep "npm install" backend/Dockerfile

# Devrait afficher :
# RUN npm install --production
```

---

## ✅ APRÈS LE TRANSFERT

```bash
# 1. Créer le réseau si nécessaire
docker network create nginx_default

# 2. Arrêter les anciens conteneurs
docker-compose down

# 3. Reconstruire le frontend
docker-compose build --no-cache frontend

# 4. Démarrer
docker-compose up -d

# 5. Vérifier
docker-compose logs -f frontend
```

---

## 📊 RÉSUMÉ

| Fichier | Modification | Criticité |
|---------|--------------|-----------|
| FilterBar.js | Protection `.map()` | 🔴 CRITIQUE |
| Home.js | Protection API | 🔴 CRITIQUE |
| WeeklyMatches.js | Protection données | 🟡 Important |
| MonthlyCalendar.js | Protection événements | 🟡 Important |
| docker-compose.yml | Réseau nginx_default | 🔴 CRITIQUE |
| backend/Dockerfile | npm install | 🟡 Important |
| backend/package.json | Dépendances | 🟡 Important |

**Total : 7 fichiers à transférer**

---

## 🎯 COMMANDE UNIQUE DE DÉPLOIEMENT

Après avoir transféré les fichiers :

```bash
docker network create nginx_default 2>/dev/null || true && \
docker-compose down && \
docker-compose build --no-cache frontend && \
docker-compose up -d && \
echo "✅ Déploiement terminé!" && \
docker-compose logs -f
```

🎉 **C'est tout ! Votre application devrait maintenant fonctionner sans erreur.**
