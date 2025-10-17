# Basket Flow

## Overview

Basket Flow is a web application that displays basketball games broadcast in France. It aggregates match data from multiple free APIs (NBA, WNBA, Euroleague, EuroCup, Betclic Elite) and provides weekly and monthly calendar views. The application enriches match data with French broadcaster information and uses AI-powered extraction for certain data sources.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18.2.0 with React Router for navigation
- Axios for API communication
- FullCalendar for interactive calendar views
- CSS modules for component styling

**Key Design Decisions:**
- Component-based architecture with separate views for weekly matches, monthly calendar, today's matches, and date-specific matches
- Protected routes for admin-only functionality
- Context-based authentication system using JWT tokens
- Responsive design for mobile and desktop
- Image proxy integration for secure logo display

**Rationale:** React provides a component-based structure that makes the codebase maintainable and allows for easy addition of new views. The use of FullCalendar provides a professional, interactive calendar interface without building custom calendar logic.

### Backend Architecture

**Technology Stack:**
- Node.js with Express.js REST API
- Prisma ORM for database operations
- PostgreSQL database
- JWT authentication with bcryptjs for password hashing
- Node-cron for scheduled daily updates

**Key Design Decisions:**
- RESTful API design with separate route handlers for matches, leagues, broadcasters, authentication, and admin operations
- Middleware-based authentication and authorization
- Service layer pattern separating business logic from route handlers
- Scheduled jobs for automated daily data updates at 6:00 AM
- Image proxy with LRU cache for efficient and secure logo serving

**Rationale:** Express provides a lightweight, flexible framework for building APIs. Prisma offers type-safe database access and easy schema migrations. The service layer pattern keeps route handlers thin and makes the codebase testable.

### Data Aggregation Strategy

**Multi-Source Architecture:**
The application uses a hybrid approach combining official APIs with AI-powered extraction:

1. **Official Free APIs (Primary Sources):**
   - NBA Official API (cdn.nba.com) - ~134 matches
   - WNBA Official API (cdn.wnba.com) - seasonal coverage
   - Euroleague XML API (api-live.euroleague.net) - ~380 matches
   - EuroCup XML API (api-live.euroleague.net) - ~380 matches

2. **AI-Enhanced Extraction (Secondary Sources):**
   - Google Gemini AI for extracting Betclic Elite schedules from TheSportsDB HTML
   - Gemini for enriching match data with broadcaster information
   - Fallback mechanisms when AI extraction fails

**Deduplication Strategy:**
- External IDs prefixed by source (e.g., `rapidapi-`, `balldontlie-`, `euroleague-`)
- Prevents duplicate matches when aggregating from multiple sources
- Idempotent daily updates ensure data consistency

**Rationale:** Using multiple free sources ensures comprehensive coverage without requiring paid API keys. The AI-powered extraction fills gaps where structured APIs don't exist. The deduplication system prevents showing the same match multiple times.

### Authentication & Authorization

**JWT-Based Authentication:**
- Tokens stored client-side with 7-day expiration
- Admin-only routes protected by role-based middleware
- Password hashing using bcryptjs with salt rounds of 10

**Session Management:**
- Express-session with PostgreSQL store (connect-pg-simple)
- Environment-based secret management for JWT and sessions

**Rationale:** JWT tokens allow stateless authentication while sessions provide server-side session management for admin operations. The dual approach balances security with scalability.

### Logo Management System

**Image Proxy Architecture:**
- Backend proxy endpoint (`/api/image-proxy`) for all external images
- LRU cache (100 images, 24-hour TTL) to reduce external requests
- Domain allowlisting for security
- 5MB size limit per image
- Automatic fallback to default logos on failure

**Logo Sources:**
- Wikimedia Commons for team logos
- Official league CDNs (NBA, WNBA, Euroleague)
- TheSportsDB for supplementary logos
- Manual logo mapping with fallbacks

**Rationale:** The proxy approach prevents mixed content warnings, reduces external dependencies, improves performance through caching, and provides a security layer by validating image sources.

### Database Schema Design

**Core Entities:**
- `User` - Authentication and authorization
- `League` - Basketball leagues (NBA, WNBA, etc.)
- `Team` - Teams with logo URLs
- `Broadcaster` - TV channels and streaming services
- `Match` - Game information with relationships
- `MatchBroadcast` - Many-to-many relationship between matches and broadcasters
- `Config` - Application configuration key-value store

**Key Relationships:**
- Match → League (many-to-one)
- Match → Team (home/away, many-to-one each)
- Match ↔ Broadcaster (many-to-many via MatchBroadcast)

**Rationale:** The schema normalizes data to avoid redundancy while maintaining referential integrity. The many-to-many relationship for broadcasts allows matches to appear on multiple channels.

### Containerization Strategy

**Docker Compose Architecture:**
- Three services: PostgreSQL, Backend (Node.js), Frontend (React)
- External network (`nginx_default`) for reverse proxy integration
- Non-conflicting ports: PostgreSQL (4532), Backend (3888), Frontend (4000)
- Environment variables managed via docker-compose.yml
- Automated Prisma migrations on backend startup

**Build Optimizations:**
- Multi-stage builds for smaller images
- Production-only dependencies
- Health checks for service readiness
- Volume persistence for PostgreSQL data

**Rationale:** Docker ensures consistent environments across development and production. The external network allows integration with existing nginx reverse proxies. Non-standard ports prevent conflicts with other applications.

## External Dependencies

### Basketball Data APIs (100% Free)

- **NBA Official API** (`cdn.nba.com`) - Schedule data for NBA games
- **WNBA Official API** (`cdn.wnba.com`) - Schedule data for WNBA games
- **Euroleague XML API** (`api-live.euroleague.net`) - Euroleague and EuroCup schedules in XML format
- **TheSportsDB** (`thesportsdb.com`) - Supplementary data for Betclic Elite and team logos

### AI Services

- **Google Gemini AI** (`@google/generative-ai`) - HTML extraction for Betclic Elite schedules, broadcaster enrichment, and data extraction from unstructured sources
- **OpenAI SDK** (`openai`) - Alternative AI provider (configured but not actively used)

### Third-Party Libraries

**Backend:**
- `@prisma/client` - Type-safe database client
- `express` - Web framework
- `jsonwebtoken` - JWT token generation and validation
- `bcryptjs` - Password hashing
- `axios` - HTTP client for external APIs
- `cheerio` - HTML parsing (legacy, mostly replaced by Gemini)
- `xml2js` - XML parsing for Euroleague API
- `node-cron` - Scheduled task execution
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable management

**Frontend:**
- `@fullcalendar/react` - Interactive calendar component
- `react-router-dom` - Client-side routing
- `axios` - API communication

### Database

- **PostgreSQL 16** - Primary data store
- Configured to run on port 4532 (non-standard to avoid conflicts)
- Prisma handles schema migrations and type generation

### Image Sources

- **Wikimedia Commons** - Primary source for team logos
- **Official League CDNs** - NBA, WNBA, Euroleague official image servers
- **TheSportsDB CDN** - Supplementary logos
- All images served through backend proxy for security and caching