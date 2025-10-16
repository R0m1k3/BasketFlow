# 🏀 Configuration RapidAPI Basketball

## ✅ Intégration Complète

L'intégration **RapidAPI Basketball (basketball-api1)** est maintenant configurée et prête à utiliser !

### 🎯 Couverture Complète des Ligues

L'API couvre toutes les ligues demandées :
- **NBA** (Tournament ID: 132)
- **WNBA** (Tournament ID: 146)  
- **Euroleague** (Tournament ID: 138)
- **EuroCup** (Tournament ID: 325)
- **Betclic Elite** (Tournament ID: 149)
- **BCL** (Tournament ID: 390)

### 📺 Diffuseurs Français Automatiques

Le système associe automatiquement les matchs aux chaînes françaises :
- **NBA** → beIN Sports, Prime Video
- **WNBA** → beIN Sports
- **Euroleague** → SKWEEK, La Chaîne L'Équipe
- **EuroCup** → SKWEEK
- **Betclic Elite** → beIN Sports, La Chaîne L'Équipe, DAZN
- **BCL** → Courtside 1891

### ✅ Validation Technique

**L'intégration a été validée par l'architecte** :
- ✅ Récupération de 21 jours de matchs pour chaque ligue
- ✅ Validation de plage de dates (pas de données hors fenêtre)
- ✅ Tournament IDs corrects pour toutes les ligues
- ✅ Fallback NBA opérationnel si pas de clé
- ✅ Interface admin fonctionnelle
- ✅ Gestion d'erreurs robuste (404 pour jours sans matchs)

### 🔧 Configuration

#### 1. Obtenir une clé API RapidAPI Basketball

1. Allez sur : **https://rapidapi.com/api-sports/api/api-basketball**
2. Cliquez sur "Subscribe to Test"
3. Choisissez un plan (plan gratuit disponible)
4. Copiez votre clé API depuis le dashboard

#### 2. Configurer la clé dans Basket Flow

1. Connectez-vous en tant qu'admin :
   - Identifiant : `admin`
   - Mot de passe : `admin`

2. Allez dans le panneau admin : `/admin`

3. Dans l'onglet "Configuration API", section "RapidAPI Basketball" :
   - Collez votre clé API
   - Cliquez sur "Save Key"
   - Cliquez sur "Test Connection" pour vérifier
   - Cliquez sur "Manual Update" pour récupérer les matchs

#### 3. Vérifier les résultats

- L'application récupérera automatiquement les matchs des 21 prochains jours
- Les matchs seront visibles dans la vue "Cette semaine" et "Calendrier mensuel"
- Les diffuseurs français seront automatiquement associés

### ⚙️ Système de Fallback

Si aucune clé RapidAPI Basketball n'est configurée, le système utilise automatiquement l'API officielle NBA comme fallback.

### 🔄 Mises à jour automatiques

- Les matchs sont automatiquement mis à jour chaque jour à **6:00 AM**
- Vous pouvez aussi déclencher une mise à jour manuelle depuis le panneau admin

### 🧪 Test du Connector

Pour tester manuellement le connector RapidAPI Basketball :

```bash
cd backend
node test-rapidapi.js
```

### 📁 Fichiers Créés

- `backend/src/services/rapidApiBasketballConnector.js` - Connector principal
- `frontend/src/components/RapidApiBasketballConfig.js` - Interface de configuration
- `backend/test-rapidapi.js` - Script de test
- `backend/src/routes/admin.js` - Routes admin ajoutées

### 🔑 Clés API Nécessaires

- `RAPIDAPI_BASKETBALL_KEY` - Clé RapidAPI Basketball (configurable dans le panneau admin)

### 📊 Architecture

```
RapidAPI Basketball API (basketball-api1.p.rapidapi.com)
    ↓
rapidApiBasketballConnector.js
    ↓
updateService.js (mise à jour quotidienne)
    ↓
Base de données PostgreSQL
    ↓
Frontend React (affichage des matchs)
```

### ✨ Avantages

1. **Données officielles** - API fiable avec +400 ligues
2. **Couverture complète** - Toutes les ligues demandées (NBA, Euroleague, Betclic Elite, etc.)
3. **Diffuseurs automatiques** - Association automatique avec les chaînes françaises
4. **Mise à jour quotidienne** - Données toujours fraîches
5. **Plan gratuit disponible** - Possibilité de tester sans coût

### 🚀 Prêt à utiliser !

L'intégration est complète et opérationnelle. Il suffit d'ajouter votre clé RapidAPI Basketball dans le panneau admin pour commencer à recevoir les données de toutes les ligues !
