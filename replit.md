# Basket Flow

## Overview

A web application that displays basketball games broadcast in France, featuring a weekly match table and monthly calendar. The app aggregates games from NBA, WNBA, Euroleague, EuroCup, and Betclic Elite, showing which French TV channels (beIN Sports, Prime Video, La Chaîne L'Équipe, DAZN, SKWEEK, etc.) are broadcasting each game. The system uses 100% free official APIs with automated daily updates at 6 AM.

## Recent Changes (October 16, 2025)

### 🆓 100% Free APIs + Gemini Enrichment ✅
**Hybrid Architecture: Official APIs + AI Intelligence**:

**Match Data Sources (All FREE)**:
1. **NBA** - Official NBA API (cdn.nba.com)
   - ExternalId prefix: `nba-{gameId}`
   - ~134 matches per 21-day window
   
2. **WNBA** - Official WNBA API (cdn.wnba.com)
   - ExternalId prefix: `wnba-{gameId}`
   - Season: May-September (0 matches in offseason)
   
3. **Euroleague** - Official XML API (api-live.euroleague.net)
   - ExternalId prefix: `euroleague-{gameId}`
   - ~380 matches via XML parsing
   - **Timezone correction**: -2 hours applied to match times
   
4. **Betclic Elite** - Gemini HTML Extraction (thesportsdb.com)
   - ExternalId prefix: `betclic-{homeTeam-vs-awayTeam-date}`
   - ~20 matches extracted from TheSportsDB web page
   - **Gemini-powered scraping**: Intelligent HTML parsing to extract authentic match data
   - Includes both upcoming matches and recent results with scores

**Broadcaster Enrichment (Optional)**:
- **Gemini AI** - Analyzes authentic matches to identify French broadcasters
- Uses match data (teams, league, date) to find correct TV channels
- Fallback to league defaults if Gemini unavailable
- Models: gemini-2.0-flash-exp (free tier)

**Services**:
- `nbaConnector.js` - NBA/WNBA official APIs
- `euroleagueConnector.js` - Euroleague XML API (timezone corrected)
- `betclicEliteConnector.js` - Gemini-powered HTML extraction from TheSportsDB
- `geminiEnrichment.js` - Broadcaster intelligence via AI
- `updateService.js` - Orchestrates all connectors

**Total Coverage**: ~534 matches across 4 leagues (100% free + AI-powered extraction)
**Excluded**: BCL (no free API), EuroCup (duplicate of Euroleague)

**Betclic Elite Solution** ✅:
- TheSportsDB API endpoint returns wrong data (English football instead of French basketball)
- **Workaround**: Gemini extracts authentic matches from TheSportsDB web page HTML
- **Targets "Upcoming" section** specifically to get future matches (17-25 Oct 2025)
- **Smart year detection**: Uses current year (2025), handles year rollover for early-year matches
- Strict prompt ensures zero hallucination - extraction only, no generation
- Successfully retrieves 10 upcoming matches from French basketball teams

**Removed Dependencies**:
- ❌ RapidAPI Basketball (paid)
- ❌ Browserless (persistent errors)
- ❌ AllSportAPI (paid)

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
- **updateService**: Orchestrates all free basketball connectors (NBA, WNBA, Euroleague, EuroCup, Betclic Elite)
- **nbaConnector**: Fetches NBA/WNBA schedules from official APIs (cdn.nba.com, cdn.wnba.com)
- **euroleagueConnector**: Fetches Euroleague/EuroCup schedules from XML API (api-live.euroleague.net)
- **betclicEliteConnector**: Fetches Betclic Elite schedule from TheSportsDB API
- **Match Routes** (`/api/matches/week`, `/api/matches/month/:year/:month`): Retrieves filtered match data with related entities
- **League Routes** (`/api/leagues`): Returns available basketball leagues
- **Broadcaster Routes** (`/api/broadcasters`): Returns TV channels/streaming platforms

**Data Model**:
- Match entity with relations to League, HomeTeam, AwayTeam, and Broadcasts
- Many-to-many relationship between Matches and Broadcasters through Broadcasts join table
- Teams and Leagues as separate entities

**Scheduled Jobs**: Node-cron configured to run daily updates at 6:00 AM for automatic match synchronization

**Data Strategy**: Uses only free, official APIs - no paid services required

### External Dependencies

**Basketball Data Sources (100% Free)**:

1. **NBA Official API** (cdn.nba.com)
   - Provides NBA match schedules
   - 21-day lookahead window
   - No API key required
   
2. **WNBA Official API** (cdn.wnba.com)
   - Provides WNBA match schedules
   - Season: May-September (offseason Oct-Apr)
   - No API key required

3. **Euroleague XML API** (api-live.euroleague.net)
   - Provides Euroleague and EuroCup schedules
   - XML format parsed with xml2js
   - No API key required

4. **TheSportsDB API** (thesportsdb.com)
   - Provides Betclic Elite (French LNB) schedules
   - Free tier (key: "3")
   - League ID: 4423

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
- PORT: Configurable server port (defaults to 3000)
- DATABASE_URL: PostgreSQL connection string (Replit Neon database or Docker PostgreSQL)

**Note**: No API keys required - all basketball data sources are free and publicly accessible.

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