# Basket Flow

## Overview

Basket Flow is a web application designed to display basketball games broadcast in France. It features a weekly match table and a monthly calendar, aggregating games from major leagues such as NBA, WNBA, Euroleague, EuroCup, and Betclic Elite. The application identifies which French TV channels (e.g., beIN Sports, Prime Video, La Chaîne L'Équipe, DAZN, SKWEEK) are broadcasting each game. A key feature is its reliance on 100% free, official APIs for match data, with automated daily updates, and AI-powered enrichment for broadcaster information and data extraction.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions

The application provides two main views: a `WeeklyMatches` component for current week games presented in a card-based layout, and a `MonthlyCalendar` for an interactive calendar view of all matches in a selected month. A `FilterBar` allows users to filter matches by league and broadcaster. Broadcaster logos are displayed with an image proxy and intelligent fallbacks (circular gradient placeholders for teams, text with emoji for broadcasters) to ensure a robust visual experience.

### Technical Implementations

The frontend is built with **React** and uses Axios for API communication. Styling is managed with CSS modules and designed to be responsive. The backend is implemented with **Node.js** and **Express.js**. It uses **Prisma ORM** for database interactions, configured for PostgreSQL. `node-cron` schedules daily updates to fetch and process match data. JWT-based authentication with user/admin roles is implemented for secure access, particularly for administrative functions like logo management.

### Feature Specifications

- **Match Display**: Weekly and monthly views of basketball games.
- **League Coverage**: NBA, WNBA, Euroleague, EuroCup, Betclic Elite.
- **Broadcaster Information**: Identification of French TV channels broadcasting each game, with automated multi-source enrichment including official league pass providers (NBA League Pass, SKWEEK, DAZN), official schedules (Prime Video NBA), and EPG TV APIs (beIN Sports, La Chaîne L'Équipe).
- **Match Scores**: Automated retrieval and display of scores for finished games from official APIs and Gemini-powered extraction.
- **Logo Management**: Admin interface for managing team and broadcaster logos, including real-time updates and an image proxy for secure and efficient display.
- **Data Updates**: Daily automated updates of match data and broadcaster information from various free API sources and AI-powered scraping.
- **Filtering**: Ability to filter matches by league and broadcaster.
- **Authentication**: JWT-based authentication with admin roles for secure management features.

### System Design Choices

- **Hybrid Architecture**: Combines official APIs for core match data with Gemini AI for intelligent HTML extraction (e.g., Betclic Elite from TheSportsDB) and broadcaster enrichment.
- **Data Idempotency**: Ensures that daily updates are idempotent, preventing duplicate entries.
- **Robust Logo System**: Utilizes a backend image proxy with an LRU cache, domain allowlisting, size limits, and smart fallbacks for secure and performant logo display.
- **Timezone Correction**: Applied for Euroleague match times.
- **Containerization**: Docker and `docker-compose` are used for environment setup and deployment, ensuring consistency across development and production.

## External Dependencies

### Basketball Data Sources (100% Free)

-   **NBA Official API**: `cdn.nba.com` for NBA match schedules.
-   **WNBA Official API**: `cdn.wnba.com` for WNBA match schedules.
-   **Euroleague XML API**: `api-live.euroleague.net` for Euroleague and EuroCup schedules.
-   **TheSportsDB**: Used for Betclic Elite schedules and general team/broadcaster logo sources. Gemini AI is employed for robust HTML extraction from this site.

### Broadcaster Data Sources

-   **NBA League Pass**: Default for NBA/WNBA.
-   **SKWEEK**: Default for Euroleague/EuroCup.
-   **DAZN**: Default for Betclic Elite.
-   **Prime Video NBA Official Schedule**: Integrated for specific NBA games.
-   **EPG.PW**: Free EPG TV API for real-time program matching on channels like beIN Sports and La Chaîne L'Équipe.

### Third-party Libraries

-   **FullCalendar**: For interactive monthly calendar display.
-   **Axios**: For HTTP client requests in the frontend and backend.
-   **Prisma ORM**: For database abstraction with PostgreSQL.
-   **node-cron**: For scheduling daily backend tasks.
-   **xml2js**: For parsing XML data from Euroleague API.

### Infrastructure

-   **PostgreSQL**: Primary database.
-   **Docker**: Containerization for frontend, backend, and database.
-   **Nginx**: Reverse proxy (implicit in Docker setup).
-   **Google Gemini (gemini-2.0-flash-exp)**: Used for AI-powered HTML extraction and broadcaster enrichment.