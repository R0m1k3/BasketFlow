# 🚀 Installation sur serveur privé - Basket Flow

## ⚠️ IMPORTANT : Scores Euroleague manquants

Si vous ne voyez pas les scores Euroleague du 16 et 17 octobre, c'est parce que votre serveur utilise **l'ancien code**.

---

## 📝 Installation complète (commandes à copier-coller)

Connectez-vous en SSH à votre serveur et exécutez ces commandes **dans l'ordre** :

### Étape 1 : Aller dans le dossier du projet

```bash
cd /data/compose/161  # Adaptez selon votre chemin
```

### Étape 2 : Sauvegarder la configuration actuelle

```bash
# Sauvegarder les variables d'environnement si elles ne sont pas dans git
cp docker-compose.yml docker-compose.yml.backup
```

### Étape 3 : Récupérer le code mis à jour

```bash
git pull origin main
```

**Attendu :** Vous devriez voir des fichiers mis à jour, notamment :
- `backend/src/services/euroleagueResultsConnector.js`
- `backend/src/services/updateService.js`

### Étape 4 : Arrêter les conteneurs

```bash
docker-compose down
```

### Étape 5 : Rebuilder l'image Docker (OBLIGATOIRE - sans cache)

```bash
docker-compose build --no-cache
```

**Durée :** ~5 minutes

### Étape 6 : Redémarrer les conteneurs

```bash
docker-compose up -d
```

### Étape 7 : Attendre le démarrage

```bash
sleep 30
```

### Étape 8 : Vérifier que tout fonctionne

```bash
docker-compose logs app | tail -30
```

**Attendu :**
```
🏀 Backend server running on port 3888
📅 Daily updates scheduled at 6:00 AM
```

---

## 🔑 Configuration Gemini API (OBLIGATOIRE)

### Option A : Via l'interface web (RECOMMANDÉ)

1. Allez sur : `https://votre-domaine.com/admin`
2. Connectez-vous avec vos identifiants admin
3. Cliquez sur **"Configuration Gemini"**
4. Entrez votre clé API Gemini (format : `AIza...`)
5. Cliquez sur **"Sauvegarder"**

### Option B : Via SQL direct

Si vous préférez la ligne de commande :

```bash
docker-compose exec postgres psql -U basketuser -d basketdb -c \
  "INSERT INTO \"Config\" (key, value) VALUES ('GEMINI_API_KEY', 'VOTRE_CLE_ICI') \
   ON CONFLICT (key) DO UPDATE SET value = 'VOTRE_CLE_ICI';"
```

**Comment obtenir une clé Gemini :**
- Allez sur : https://aistudio.google.com/app/apikey
- Créez une clé API gratuite
- Copiez la clé (format : `AIza...`)

---

## 🔄 Lancer une mise à jour manuelle

### Méthode 1 : Via l'interface admin (RECOMMANDÉ)

1. Allez sur : `https://votre-domaine.com/admin`
2. Cliquez sur **"Lancer mise à jour"**
3. Attendez 1-2 minutes

### Méthode 2 : Via API

```bash
# D'abord, récupérez votre token admin en vous connectant à l'interface
# Puis :
curl -X POST https://votre-domaine.com/api/admin/update \
  -H "Authorization: Bearer VOTRE_TOKEN_ADMIN"
```

### Méthode 3 : Via Docker (le plus simple)

```bash
docker-compose exec app node -e "
const { updateMatches } = require('./src/services/updateService');
updateMatches().then(() => {
  console.log('✅ Update completed');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
"
```

---

## ✅ Vérification : Scores Euroleague présents

### 1. Vérifier dans les logs

```bash
docker-compose logs app | grep Euroleague
```

**Attendu :**
```
✅ Euroleague: Created X matches, Updated Y matches
```

**Si vous voyez :**
```
⚠️ No Gemini API key - skipping Euroleague
```
→ La clé Gemini n'est pas configurée. Retour à l'étape "Configuration Gemini".

### 2. Vérifier dans la base de données

```bash
docker-compose exec postgres psql -U basketuser -d basketdb -c \
  "SELECT 
     ht.name as home, 
     m.\"homeScore\", 
     m.\"awayScore\", 
     at.name as away,
     DATE(m.\"dateTime\") as date
   FROM \"Match\" m
   JOIN \"Team\" ht ON m.\"homeTeamId\" = ht.id
   JOIN \"Team\" at ON m.\"awayTeamId\" = at.id
   JOIN \"League\" l ON m.\"leagueId\" = l.id
   WHERE l.name = 'Euroleague' 
   AND m.\"homeScore\" IS NOT NULL
   AND DATE(m.\"dateTime\") >= '2025-10-16'
   ORDER BY m.\"dateTime\" DESC
   LIMIT 10;"
```

**Attendu :** Vous devriez voir les matchs du 16 et 17 octobre avec leurs scores :

```
      home       | homeScore | awayScore |        away         |    date
-----------------+-----------+-----------+---------------------+------------
 Paris Basketball|    88     |    89     | Hapoel Tel Aviv     | 2025-10-17
 Baskonia        |    79     |    91     | Partizan            | 2025-10-17
 Dubai Basketball|    83     |    78     | FC Barcelona        | 2025-10-16
 Fenerbahce      |    88     |    73     | FC Bayern Munich    | 2025-10-16
```

### 3. Vérifier sur le site web

1. Allez sur : `https://votre-domaine.com`
2. Cliquez sur **"Cette semaine"**
3. Filtrez par **"Euroleague"** si nécessaire
4. Vous devriez voir les matchs du 16 et 17 octobre **AVEC scores**

---

## 🤖 Mises à jour automatiques

### Le système inclut déjà :

✅ **Cron quotidien à 6h du matin** (heure serveur)
- Met à jour automatiquement NBA, WNBA, Euroleague, Betclic Elite
- Enrichit avec les diffuseurs
- Nettoie les anciens matchs

### Vérifier que le cron fonctionne :

```bash
docker-compose logs app | grep "Daily updates scheduled"
```

**Attendu :**
```
📅 Daily updates scheduled at 6:00 AM
```

### Forcer une mise à jour immédiate (pour tester) :

```bash
docker-compose restart app
sleep 10
docker-compose logs app | tail -50
```

---

## 🔧 Dépannage

### Problème : "No Gemini API key"

**Cause :** Clé Gemini non configurée

**Solution :** Voir section "Configuration Gemini API" ci-dessus

---

### Problème : Scores toujours absents après mise à jour

**Cause :** Status des matchs mal configuré

**Solution :** Mettre à jour les statuts manuellement :

```bash
docker-compose exec postgres psql -U basketuser -d basketdb -c \
  "UPDATE \"Match\" SET status = 'finished' \
   WHERE \"homeScore\" IS NOT NULL 
   AND \"awayScore\" IS NOT NULL 
   AND status != 'finished';"
```

---

### Problème : Gemini extrait seulement 10 matchs

**Cause :** Limitation du modèle Gemini

**Solution :** Le code actuel demande déjà d'extraire TOUS les matchs. Si le problème persiste après rebuild :

1. Vérifiez la version du code :
```bash
git log --oneline -1
```

Devrait afficher un commit récent mentionnant "Euroleague" ou "Gemini"

2. Vérifiez le fichier :
```bash
grep "LA TOTALITÉ" backend/src/services/euroleagueResultsConnector.js
```

Devrait afficher 2 lignes avec "LA TOTALITÉ"

---

### Problème : L'image Docker ne se rebuild pas

**Solution :** Forcer la suppression et rebuild :

```bash
docker-compose down
docker rmi basketflow-app
docker-compose build --no-cache
docker-compose up -d
```

---

## 📊 Statistiques attendues

Après installation et première mise à jour :

| Compétition     | Nombre de matchs attendu |
|-----------------|--------------------------|
| NBA             | ~178 matchs              |
| WNBA            | ~0-40 matchs (saison)    |
| **Euroleague**  | **~20 matchs** ✅        |
| Betclic Elite   | ~20 matchs               |
| **TOTAL**       | **~218-238 matchs**      |

**Note :** EuroCup est temporairement désactivé (API cassée, migration Gemini nécessaire).

---

## ✅ Checklist finale

- [ ] Code mis à jour (`git pull`)
- [ ] Docker rebuilté (`docker-compose build --no-cache`)
- [ ] Conteneurs redémarrés (`docker-compose up -d`)
- [ ] Clé Gemini configurée (via admin ou SQL)
- [ ] Mise à jour lancée (manuelle ou attendre 6h AM)
- [ ] Scores Euroleague visibles dans la BDD
- [ ] Scores Euroleague visibles sur le site web
- [ ] Cron quotidien programmé (vérifié dans les logs)

---

## 🎉 C'est terminé !

Votre application Basket Flow devrait maintenant :
- ✅ Afficher les scores Euroleague du 16 et 17 octobre
- ✅ Se mettre à jour automatiquement tous les jours à 6h AM
- ✅ Récupérer TOUS les matchs Euroleague disponibles

Si vous avez encore des problèmes, vérifiez les logs :
```bash
docker-compose logs -f app
```
