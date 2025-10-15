# Basket Flow

## Overview

A web application that displays basketball games broadcast in France, featuring a weekly match table and monthly calendar. The app aggregates games from NBA, WNBA, Euroleague, Eurocup, BCL, and Betclic Elite, showing which French TV channels (beIN Sports, Prime Video, La Chaîne L'Équipe, DAZN, SKWEEK, etc.) are broadcasting each game. The system includes automated daily updates via external basketball APIs (RapidAPI).

## Recent Changes (October 15, 2025)

### API-Basketball Integration avec Mapping Intelligent ✅
- Utilise API-Basketball (RapidAPI) pour données en temps réel
- Mapping automatique des diffuseurs français selon les ligues
- beIN Sports (400+ matchs NBA), Prime Video (29 matchs dominicaux NBA)
- SKWEEK (tous Euroleague), La Chaîne L'Équipe (matchs sélectionnés gratuits)
- TV Monaco (tous matchs AS Monaco Euroleague)
- Panel admin pour configuration API_BASKETBALL_KEY
- Site renommé de "Basket France" à "Basket Flow"
- Mise à jour automatique quotidienne à 6h00

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

**Basketball Data API**: 
- API-Basketball.com via RapidAPI (requires API_BASKETBALL_KEY environment variable)
- Fetches matches for NBA (league 12), WNBA (league 16), Euroleague (league 120), Betclic Elite (league 117)
- Updates are idempotent using unique externalId constraint to prevent duplicates
- Free tier: 100 requests/day, paid plans from €10/month
- Fallback: Sample data seeding when API key is not configured

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
- API_BASKETBALL_KEY: **REQUIRED for production** - RapidAPI key for API-Basketball.com (falls back to sample data if missing)
- PORT: Configurable server port (defaults to 3000)
- DATABASE_URL: PostgreSQL connection string (Replit Neon database or Docker PostgreSQL)

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