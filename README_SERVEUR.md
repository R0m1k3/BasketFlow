# 🏀 Basket Flow - Installation Serveur Privé

## ✅ Configuration Finale

**init.sql s'exécute automatiquement** au démarrage de PostgreSQL et crée :
- ✅ Toutes les tables
- ✅ L'administrateur (admin/admin)  
- ✅ Les index

**Prisma** est utilisé uniquement comme query builder (pas de migrations).

---

## 📦 Fichiers à Transférer

```
basket-flow/
├── docker-compose.yml
├── init.sql
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/schema.prisma
│   └── src/
└── frontend/
    └── (tous les fichiers)
```

---

## 🚀 Installation

### Sur votre serveur privé :

```bash
# 1. Aller dans le dossier
cd /chemin/vers/basket-flow

# 2. Créer le réseau (première fois uniquement)
docker network create nginx_default

# 3. Démarrer
docker-compose up -d
```

**Attendez 30-40 secondes.**

---

## 🔐 Test Login

**URL :** http://localhost:4000/login

**Identifiants :**
- Identifiant : `admin`
- Mot de passe : `admin`

---

## 🔍 Vérification

```bash
# Statut des conteneurs
docker-compose ps

# Logs backend
docker-compose logs backend

# Logs PostgreSQL
docker-compose logs postgres
```

---

## 🔄 Réinstallation Complète

```bash
docker-compose down -v
docker volume rm basket_postgres_data
docker-compose up -d
```

---

## ⚙️ Comment ça Marche

### 1. PostgreSQL (0-20s)
- Démarre sur port 4532
- **Exécute automatiquement** `/docker-entrypoint-initdb.d/01-init.sql`
- Crée extension `uuid-ossp`
- Crée toutes les tables
- Crée l'admin (admin/admin)

### 2. Backend (20-30s)
- Attend 10 secondes (PostgreSQL prêt)
- Génère Prisma Client (query builder uniquement)
- Démarre serveur Express sur port 3888
- **Aucune migration Prisma** n'est exécutée

### 3. Frontend (30-40s)
- Compile l'application React
- Démarre sur port 4000

---

## ✅ Points Clés

✓ **init.sql fait tout** - Tables, admin, config  
✓ **Prisma = query builder** - Pas de migrations  
✓ **100% automatique** - Aucune commande manuelle  
✓ **Fiable** - PostgreSQL standard  

---

## 🆘 Dépannage

### Backend ne démarre pas
```bash
docker-compose logs backend
```

### PostgreSQL non prêt
```bash
docker-compose restart postgres
sleep 15
docker-compose restart backend
```

### Login échoue
```bash
# Vérifier que l'admin existe
docker exec basket_postgres psql -U basketuser -d basketdb -p 4532 \
  -c "SELECT username, role FROM \"User\";"
```

---

## 📊 Architecture

```
┌─────────────────┐
│   PostgreSQL    │
│   Port: 4532    │ ← init.sql s'exécute au démarrage
└────────┬────────┘
         │
┌────────▼────────┐
│   Backend API   │
│   Port: 3888    │ ← Prisma Client (requêtes)
└────────┬────────┘
         │
┌────────▼────────┐
│   Frontend      │
│   Port: 4000    │
└─────────────────┘
```

---

## 🎯 Résumé

1. Transférez les fichiers
2. `docker-compose up -d`
3. Attendez 30 secondes
4. Login : admin/admin

**C'est tout !** ✅
