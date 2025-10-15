# Basketball Match Tracker - France

## Overview

A web application that displays basketball games broadcast in France, featuring a weekly match table and monthly calendar. The app aggregates games from NBA, WNBA, Euroleague, Eurocup, BCL, and Betclic Elite, showing which French TV channels (beIN Sports, Prime Video, La Chaîne L'Équipe, DAZN, SKWEEK, etc.) are broadcasting each game. The system includes automated daily updates via external basketball APIs (RapidAPI).

## Recent Changes (October 15, 2025)

- ✅ Implemented complete Docker configuration (docker-compose.yml, Dockerfiles for backend/frontend)
- ✅ Added API-Basketball integration via RapidAPI for live match data
- ✅ Implemented idempotent updates using unique externalId constraint
- ✅ Fixed daily update service to fetch real data from basketball API
- ✅ Configured node-cron for automatic daily updates at 6:00 AM
- ✅ Added PostgreSQL database with Prisma ORM
- ✅ Created frontend React components (WeeklyMatches, MonthlyCalendar, FilterBar)
- ✅ Implemented filtering by league and broadcaster
- ✅ Added sample data seeding with idempotent upserts

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
- Primary: API-Basketball.com via RapidAPI (requires API_BASKETBALL_KEY environment variable)
- Fetches matches for NBA (league 12), WNBA (league 16), Euroleague (league 120), Betclic Elite (league 117)
- Updates are idempotent using unique externalId constraint to prevent duplicates
- Fallback: Sample data seeding when API key is not configured

**Broadcaster Mapping**:
- Hardcoded mapping between leagues and French TV channels
- Includes metadata about free vs paid channels
- Season-specific broadcasting rights tracking (e.g., Prime Video for NBA 2025-26, beIN Sports for 2024-25)

**Third-party Libraries**:
- FullCalendar for calendar visualization
- Axios for HTTP requests
- Prisma for database abstraction

**Infrastructure**:
- Docker containerization with docker-compose
- Nginx reverse proxy (connects via nginx_default network)
- Frontend on port 5000, Backend on port 3000

**Environment Configuration**:
- API_BASKETBALL_KEY: RapidAPI key for API-Basketball.com (required for live data fetching)
- PORT: Configurable server port (defaults to 3000)
- DATABASE_URL: PostgreSQL connection string (Replit Neon database or Docker PostgreSQL)

**Development Mode**:
- Backend runs on port 3000 with nodemon for hot reload
- Uses Replit PostgreSQL database for development
- Workflow "Backend" configured to run `cd backend && npm run dev`