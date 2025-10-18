# 🚀 GUIDE RAPIDE - Déploiement Basket Flow

## ✅ Problème résolu : SCORES EUROLEAGUE (18 octobre 2025)

**Cause identifiée :** TOUTES les APIs officielles Euroleague sont cassées ou vides :
- `api-live.euroleague.net/v1/schedules` → Retourne 0 ligne (vide)
- `live.euroleague.net/api/Games` → 404 Error
- Autres endpoints → Erreurs ou aucune donnée

**Solution appliquée :** Migration vers 100% Gemini + TheSportsDB
- `euroleagueResultsConnector.js` gère maintenant TOUS les matchs Euroleague (passés + futurs)
- Gemini extrait les données HTML de TheSportsDB pour :
  - Section "Results" → Matchs passés AVEC SCORES + status='finished'
  - Section "Upcoming" → Matchs futurs sans scores + status='scheduled'
- Création automatique des équipes manquantes
- Système de déduplication basé sur externalId
- **FIX CRITIQUE** : Status automatiquement mis à 'finished' si scores présents

**Fichiers supprimés :**
- `euroleagueOfficialConnector.js` (API 404)
- `euroleagueConnector.js` (XML API vide)

---

## 🚀 Déploiement RAPIDE sur votre serveur (3 minutes)

### Commandes à exécuter :

```bash
# 1. Aller dans le dossier (adaptez selon votre chemin)
cd /data/compose/161

# 2. Récupérer le nouveau code
git pull origin main

# 3. Rebuilder et redémarrer (OBLIGATOIRE - sinon le code ne change pas)
docker-compose build --no-cache
docker-compose down
docker-compose up -d

# 4. Attendre 30 secondes
sleep 30

# 5. Vérifier que ça tourne
docker-compose logs app | grep "Backend server running"
```

**Attendu :** `🏀 Backend server running on port 3888`

### Nouveaux logs améliorés :

Vous verrez maintenant les matchs créés/mis à jour :
```
✅ Created: Paris Bas 88-89 Hapoel Te
✅ Created: Baskonia 79-91 KK Partiz
✅ Created: Lyon-Vill 83-90 Virtus Pa
... (10 matchs Euroleague avec scores)
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
- WNBA : ~0-40 matchs saisonniers (API officielle)
- **Euroleague : ~10-20 matchs avec scores** (Gemini + TheSportsDB) ✅
- EuroCup : Temporairement désactivé (XML API cassée)
- Betclic Elite : ~10-20 matchs (Gemini + TheSportsDB)

**TOTAL : ~200-260 matchs actifs**

**Scores visibles pour :**
- ✅ NBA (tous les matchs joués)
- ✅ **Euroleague 15-17 octobre : 10+ matchs avec scores** ✅
- ✅ Betclic Elite (matchs récents)

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

### Problème : Scores présents mais status='scheduled' au lieu de 'finished'

**Cause :** Bug dans la logique de détermination du statut (corrigé)

**Solution :** Mettez à jour manuellement les statuts dans la base :
```bash
docker-compose exec db psql -U basketuser -d basketdb -c \
  "UPDATE \"Match\" SET status = 'finished' WHERE \"homeScore\" IS NOT NULL AND \"awayScore\" IS NOT NULL AND status != 'finished';"
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
