# Basket Flow

## Overview

A web application that displays basketball games broadcast in France, featuring a weekly match table and monthly calendar. The app aggregates games from NBA, WNBA, Euroleague, Eurocup, BCL, and Betclic Elite, showing which French TV channels (beIN Sports, Prime Video, La Chaîne L'Équipe, DAZN, SKWEEK, etc.) are broadcasting each game. The system includes automated daily updates via external basketball APIs (RapidAPI).

## Recent Changes (October 15, 2025)

### 🏀 Basketball Data API + Gemini Enrichment Architecture ✅
**Two-Step Data Pipeline**:
- **Step 1: Basketball Data API** (BroadageSports on RapidAPI) fetches matches and live scores
  - 100+ tournaments including NBA, WNBA, Euroleague, EuroCup, Betclic Elite, BCL
  - Live scores updated every 15 seconds
  - ExternalId prefix: `basketballdata-`
- **Step 2: Gemini AI** enriches matches with French broadcaster information only
  - Targeted queries for finding French TV channels/streaming platforms
  - No match creation, only broadcaster enrichment
  - ExternalId prefix: maintained from source data
- **Admin Panel**: Toggle Basketball Data API and Gemini enrichment ON/OFF independently
- **Automated updates**: Daily at 6:00 AM
- Services: `basketballDataService.js` (matches/scores) + `geminiEnrichmentService.js` (broadcasters)

### 🖼️ Robust Logo Display System ✅
**Image Proxy with Security & Fallbacks**:
- **Backend proxy** (`/api/image-proxy`) resolves CORS/CSP issues with external logos in Replit iframe
- **LRU Cache** with lastUsed-based eviction (100 entries, 24h TTL) for performance
- **Security hardening**:
  - Domain allowlist: Wikimedia, NBA/WNBA, Euroleague, team sites, logo CDNs
  - 5MB size limit prevents resource exhaustion
  - 403 blocks for unauthorized domains
- **Smart fallbacks**:
  - Teams: Circular gradient placeholders with initials (e.g., "BO" for Boston)
  - Broadcasters: Text with emoji indicators (📺 free, 💰 paid)
  - Auto-detection: onError handlers switch to fallback when image fails
- **Logo Management**:
  - `backend/src/utils/logoMapping.js`: Curated URLs for major teams/broadcasters
  - `backend/src/scripts/fixLogos.js`: Script to update DB with verified URLs
  - Verified URLs from Wikimedia Commons (PNG format for reliability)
- **Frontend integration**: All logos in WeeklyMatches & MonthlyCalendar use proxy + fallbacks

### Authentication & Security System ✅
- Implemented JWT-based authentication with user/admin roles
- Created secure admin initialization with random password generation (crypto.randomBytes)
- Enforced JWT_SECRET requirement - server refuses to start without it
- Added security hardening with .env.example and comprehensive documentation
- Created Login/Register components with AuthContext for state management
- Built AdminPanel for API key configuration and user management
- Added ProtectedRoute component for admin-only access control

### Application Features ✅
- Complete Docker configuration (docker-compose.yml, Dockerfiles for backend/frontend)
- API-Basketball integration via RapidAPI for live match data
- Idempotent updates using unique externalId constraint
- Daily update service with node-cron (6:00 AM automatic sync)
- PostgreSQL database with Prisma ORM
- Frontend React components (WeeklyMatches, MonthlyCalendar, FilterBar)
- Filtering by league and broadcaster
- Sample data seeding with idempotent upserts

### Documentation ✅
- Created INSTALLATION.md with security-focused setup instructions
- Updated README.md with security warnings and quick start guide
- Added .env.example template without real secrets

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: React with create-react-app

**Core Components**:
- **WeeklyMatches**: Displays matches for the current week in a card-based layout with filtering
- **MonthlyCalendar**: Interactive calendar view using FullCalendar library showing all matches for a selected month
- **FilterBar**: Provides filtering controls for leagues and broadcasters

**State Management**: Component-level useState hooks for local state, with parent App component managing shared filter state

**API Communication**: Axios for REST API calls to the backend, with proxy configuration to localhost:3000

**Styling**: CSS modules per component with responsive design considerations

### Backend Architecture

**Technology Stack**: Node.js with Express.js framework

**Database**: Prisma ORM (configured for SQL databases, likely PostgreSQL based on dependencies)

**Core Services**:
- **updateService**: Handles data synchronization with API-Basketball via RapidAPI, manages broadcaster mappings, and ensures idempotent updates using unique externalId constraint
- **Match Routes** (`/api/matches/week`, `/api/matches/month/:year/:month`): Retrieves filtered match data with related entities
- **League Routes** (`/api/leagues`): Returns available basketball leagues
- **Broadcaster Routes** (`/api/broadcasters`): Returns TV channels/streaming platforms

**Data Model**:
- Match entity with relations to League, HomeTeam, AwayTeam, and Broadcasts
- Many-to-many relationship between Matches and Broadcasters through Broadcasts join table
- Teams and Leagues as separate entities

**Scheduled Jobs**: Node-cron configured to run daily updates at 6:00 AM for automatic match synchronization

**Fallback Strategy**: When API key is unavailable, system seeds sample data instead of failing

### External Dependencies

**Basketball Data Sources (2-Step Pipeline)**: 

1. **Basketball Data API (BroadageSports on RapidAPI)** - Primary Source
   - Couverture: 100+ tournaments including NBA, WNBA, Euroleague, EuroCup, Betclic Elite, BCL
   - ExternalId prefix: `basketballdata-`
   - Live scores updated every 15 seconds
   - Configuration: BASKETBALL_DATA_KEY in admin panel
   - Free tier available with quotas

2. **Gemini AI Enrichment** - Broadcaster Information
   - Purpose: Enriches existing matches with French broadcaster data only
   - Does NOT create matches, only adds French TV/streaming info
   - Configuration: GEMINI_API_KEY (Replit integration JavaScript) in admin panel
   - Searches for: beIN Sports, Prime Video, SKWEEK, La Chaîne L'Équipe, DAZN, etc.
   - Uses targeted Google Search queries for accuracy

**Pipeline Flow**: Basketball Data fetches matches/scores → Gemini enriches with French broadcasters
**Configuration**: Both sources can be toggled ON/OFF independently in admin panel

**Broadcaster Mapping** (Intelligence améliorée 2025):
- **NBA**: beIN Sports (400+ matchs/saison), Prime Video (29 matchs dominicaux), NBA League Pass
- **WNBA**: NBA League Pass, beIN Sports  
- **Euroleague**: SKWEEK (tous), La Chaîne L'Équipe (matchs sélectionnés Paris/ASVEL), TV Monaco (AS Monaco), EuroLeague TV
- **Betclic Elite**: beIN Sports, La Chaîne L'Équipe, DAZN
- **EuroCup**: SKWEEK, EuroLeague TV
- **BCL**: Courtside 1891

**Third-party Libraries**:
- FullCalendar for calendar visualization
- Axios for HTTP requests
- Prisma for database abstraction

**Infrastructure**:
- Docker containerization with docker-compose
- Nginx reverse proxy (connects via nginx_default network)
- Frontend on port 4000 (Docker) / port 5000 (Replit dev)
- Backend on port 3001 (Docker) / port 3000 (Replit dev)
- PostgreSQL on port 4532 (external) / 5432 (internal) - évite conflit avec Replit database

**Environment Configuration** (All configured in backend/.env):
- JWT_SECRET: **REQUIRED** - Cryptographic secret for JWT signing (must be generated randomly)
- SESSION_SECRET: **REQUIRED** - Session secret for Express sessions
- API_BASKETBALL_KEY: **OPTIONAL** - RapidAPI key for API-Basketball.com (Source 1)
- BALLDONTLIE_API_KEY: **OPTIONAL** - BallDontLie API key (Source 2, gratuit)
- Euroleague API: **OPTIONAL** - Aucune clé requise (Source 3, gratuit)
- PORT: Configurable server port (defaults to 3000)
- DATABASE_URL: PostgreSQL connection string (Replit Neon database or Docker PostgreSQL)

**Note**: Les 3 sources API sont optionnelles. L'app fonctionne avec sample data si aucune source n'est configurée.

**Security Notes**:
- .env files must NEVER be committed to version control
- .env.example provided as template without real secrets
- JWT_SECRET enforced at server startup - application refuses to run without it
- Admin password randomly generated on first initialization
- All passwords hashed with bcrypt (10 salt rounds)

**Development Mode**:
- Backend runs on port 3000 with nodemon for hot reload
- Uses Replit PostgreSQL database for development
- Workflow "Backend" configured to run `cd backend && npm run dev`