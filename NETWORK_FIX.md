# 🌐 CONFIGURATION RÉSEAU - nginx_default

## ✅ Modifications Appliquées

Toutes les applications Basket Flow sont maintenant sur le réseau externe **nginx_default** :

- ✅ **postgres** → nginx_default
- ✅ **backend** → nginx_default  
- ✅ **frontend** → nginx_default

---

## 🚀 DÉPLOIEMENT

**Sur votre serveur, exécutez :**

```bash
# 1. Arrêter les conteneurs
docker-compose down

# 2. Vérifier que le réseau nginx_default existe
docker network ls | grep nginx_default

# 3. Si le réseau n'existe pas, le créer :
docker network create nginx_default

# 4. Reconstruire (si nécessaire)
docker-compose build --no-cache

# 5. Démarrer tous les services
docker-compose up -d

# 6. Vérifier les logs
docker-compose logs -f backend
```

---

## 📋 Configuration Réseau Finale

| Service | Réseau | Port Externe | Conteneur |
|---------|--------|--------------|-----------|
| Frontend | nginx_default | 4000 | basket_frontend |
| Backend | nginx_default | 3888 | basket_backend |
| PostgreSQL | nginx_default | 4532 | basket_postgres |

**Votre autre application** partage maintenant le même réseau `nginx_default` avec Basket Flow.

---

## 🔍 Vérification

### Voir tous les conteneurs sur nginx_default :
```bash
docker network inspect nginx_default
```

Vous devriez voir :
- `basket_frontend`
- `basket_backend`
- `basket_postgres`
- (vos autres applications)

### Vérifier la connectivité :
```bash
# Depuis le backend vers postgres
docker exec basket_backend ping -c 2 basket_postgres

# Depuis votre autre app vers basket_postgres
docker exec <votre_autre_conteneur> ping -c 2 basket_postgres
```

---

## ⚠️ Note Importante

**Nom du conteneur PostgreSQL :** `basket_postgres`

Si votre autre application cherche un conteneur nommé simplement `postgres`, elle **ne trouvera pas** `basket_postgres`. 

**Les deux applications PostgreSQL coexistent maintenant sur le même réseau :**
- Votre autre app : `postgres:5432`
- Basket Flow : `basket_postgres:4532`

---

## ✅ Résultat Attendu

Le backend devrait démarrer avec :

```
✅ JWT_SECRET est configuré
✅ Administrateur créé avec succès !
   👤 Identifiant: admin
   🔑 Mot de passe: admin
🏀 Backend server running on port 3888
📅 Daily updates scheduled at 6:00 AM
```

**Accès :**
- Frontend : http://localhost:4000
- Backend : http://localhost:3888
- PostgreSQL : localhost:4532

🎉 **Toutes les applications partagent maintenant le réseau nginx_default !**
