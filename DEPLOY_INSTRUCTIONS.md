# Instructions de déploiement - Basket Flow

## ✅ Problème résolu : SCORES EUROLEAGUE

**Cause identifiée :** TOUTES les APIs officielles Euroleague sont cassées ou vides :
- `api-live.euroleague.net/v1/schedules` → Retourne 0 ligne (vide)
- `live.euroleague.net/api/Games` → 404 Error
- Autres endpoints → Erreurs ou aucune donnée

**Solution appliquée :** Migration vers 100% Gemini + TheSportsDB
- `euroleagueResultsConnector.js` gère maintenant TOUS les matchs Euroleague (passés + futurs)
- Gemini extrait les données HTML de TheSportsDB pour :
  - Section "Results" → Matchs passés AVEC SCORES
  - Section "Upcoming" → Matchs futurs sans scores
- Création automatique des équipes manquantes
- Système de déduplication basé sur externalId

**Fichiers supprimés :**
- `euroleagueOfficialConnector.js` (API 404)
- `euroleagueConnector.js` (XML API vide)

---

## 🚀 Déploiement sur votre serveur

**IMPORTANT :** Vous devez avoir configuré une clé API Gemini dans l'interface admin AVANT de déployer.

### Étape 1 : Mettre à jour le code

```bash
cd /chemin/vers/basket-flow
git pull origin main
```

### Étape 2 : Rebuild Docker (sans cache)

```bash
docker-compose build --no-cache
```

### Étape 3 : Redémarrer les conteneurs

```bash
docker-compose down
docker-compose up -d
```

### Étape 4 : Vérifier les logs

```bash
docker-compose logs -f app
```

Vous devriez voir :
```
✅ Euroleague: Created X matches, Updated Y matches (total Z)
```

---

## 🔧 Configuration Gemini (si pas déjà fait)

1. Allez sur votre interface admin : `https://votre-domaine.com/admin`
2. Connectez-vous avec vos identifiants admin
3. Cliquez sur "Configuration Gemini"
4. Entrez votre clé API Gemini
5. Cliquez sur "Sauvegarder"

**Note :** La clé Gemini est stockée dans la base de données (table Config) et sera automatiquement utilisée par tous les connecteurs.

---

## 📊 Attendu après déploiement

**Matchs par compétition (approximatif) :**
- NBA : ~178 matchs (API officielle)
- WNBA : ~40 matchs saisonniers (API officielle)
- **Euroleague : ~60 matchs** (Gemini + TheSportsDB)
- EuroCup : ~380 matchs (XML API)
- Betclic Elite : ~20 matchs (Gemini + TheSportsDB)

**TOTAL : ~678 matchs**

---

## 🕐 Mises à jour automatiques

Le système met à jour automatiquement les données chaque jour à **6h00 du matin**.

Pour les matchs Euroleague :
- ✅ Scores mis à jour pour les matchs passés
- ✅ Nouveaux matchs ajoutés automatiquement
- ✅ Création automatique des équipes manquantes

---

## ⚠️ Dépannage

### Problème : "No matches found" dans les logs Euroleague

**Cause :** Clé Gemini manquante ou invalide

**Solution :**
1. Vérifiez que la clé est bien configurée dans l'admin
2. Relancez manuellement la mise à jour via l'API :
   ```bash
   curl -X POST http://localhost:3888/api/admin/update \
     -H "Authorization: Bearer VOTRE_TOKEN_ADMIN"
   ```

### Problème : Scores toujours à null

**Cause :** L'ancien code tourne encore (pas rebuilté)

**Solution :**
1. Vérifiez la date de build de l'image Docker :
   ```bash
   docker images | grep basket
   ```
2. Si l'image est ancienne, refaites un build :
   ```bash
   docker-compose build --no-cache
   docker-compose up -d
   ```

---

## 🔍 Vérification manuelle

Pour tester si les scores Euroleague fonctionnent :

```bash
# Vérifier les matchs Euroleague dans la BDD
docker-compose exec db psql -U postgres -d basketflow -c \
  "SELECT \"homeTeam\".name as home, \"homeScore\", \"awayScore\", \"awayTeam\".name as away 
   FROM \"Match\" 
   JOIN \"Team\" as \"homeTeam\" ON \"Match\".\"homeTeamId\" = \"homeTeam\".id 
   JOIN \"Team\" as \"awayTeam\" ON \"Match\".\"awayTeamId\" = \"awayTeam\".id 
   JOIN \"League\" ON \"Match\".\"leagueId\" = \"League\".id 
   WHERE \"League\".name = 'Euroleague' 
   AND \"homeScore\" IS NOT NULL 
   LIMIT 5;"
```

Si cette requête retourne des résultats avec des scores, le système fonctionne ! ✅

---

## 📝 Architecture finale des données Euroleague

**Source de données :** TheSportsDB (https://www.thesportsdb.com/league/4480-Euroleague)

**Extraction :** Google Gemini AI (modèle gemini-2.0-flash-exp)

**Processus :**
1. Téléchargement du HTML de TheSportsDB
2. Gemini extrait les matchs de deux sections :
   - "Results" → Matchs terminés avec scores réels
   - "Upcoming" → Matchs à venir (scores null, status "scheduled")
3. Mapping automatique des noms d'équipes
4. Création/mise à jour dans la base de données

**Fréquence :** Quotidienne à 6h00 AM + toutes les 6 heures via cron

---

## ✅ Checklist de déploiement

- [ ] Code mis à jour (`git pull`)
- [ ] Clé Gemini configurée dans l'admin
- [ ] Docker rebuilté (`docker-compose build --no-cache`)
- [ ] Conteneurs redémarrés (`docker-compose up -d`)
- [ ] Logs vérifiés (aucune erreur)
- [ ] Scores Euroleague visibles sur le site
- [ ] Mises à jour automatiques programmées (6h AM)

---

## 🎉 C'est fait !

Votre application Basket Flow devrait maintenant afficher correctement tous les scores Euroleague, mis à jour automatiquement chaque jour.

Si vous avez des problèmes, vérifiez les logs :
```bash
docker-compose logs -f app
```
