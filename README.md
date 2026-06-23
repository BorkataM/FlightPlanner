# SkyWave ✈️

An intelligent flight booking and route-analytics platform. Search flights, book them, manage bookings and boarding passes, and chat with an AI assistant that ranks flights by a "SmartScore" combining price, duration, CO₂ emissions, and delay probability.

**Live app:** https://skywave-web.onrender.com

> Hosted on Render's free tier — the two Docker backends spin down when idle, so the first request after a nap can take ~50s to wake up.

## Architecture

SkyWave is a three-service application:

| Service | Stack | Local URL | Production URL |
|---------|-------|-----------|----------------|
| **Client** (`client/`) | React 18 + TypeScript + Vite + Tailwind | http://localhost:5173 | https://skywave-web.onrender.com |
| **API** (`server/`) | ASP.NET Core Web API (.NET 10) | https://localhost:7236 | https://skywave-api.onrender.com |
| **AI Service** (`ai-service/`) | Python FastAPI | http://localhost:8000 | https://skywave-ai.onrender.com |

- **Database:** PostgreSQL (Supabase). The .NET API owns the schema and CRUD; the Python service reads/updates the same tables for analytics. Always connect via the Supabase IPv4 session pooler — the direct `db.*.supabase.co` host is IPv6-only.
- The .NET API does **not** compute analytics — it delegates to the Python AI service (CO₂, SmartScore, delay probability).
- Authentication uses JWT plus Google OAuth (Sign in with Google).

## Features

- Flight search with interactive maps (Leaflet / react-simple-maps)
- Booking flow with Google Pay, travelers management, and generated boarding passes
- "My Bookings" management and password reset (email-based)
- Social features (user follows) and weather lookups
- AI chat assistant with flight search, analytics, and "smartest flights" tooling

## Project structure

```
FlightPlanner/
├── client/                 # React + Vite frontend (SkyWave)
│   └── src/
│       ├── pages/          # LandingPage, SearchResults, Booking, MyBookings, BoardingPass, ...
│       ├── components/     # auth, bookings, common, layout, sections, social
│       ├── context/  features/  services/  localization/  types/
├── server/                 # ASP.NET Core solution (.NET 10)
│   └── FlightPlanner.API/
│       ├── FlightPlanner.API/         # Controllers: Auth, Flights, Airports, Bookings, Social, Users, Weather, AiChat
│       ├── FlightPlanner.Core/        # Interfaces & Services (domain)
│       └── FlightPlanner.Infrastructure/  # Repositories & data access
├── ai-service/             # Python FastAPI analytics + chat microservice
├── docker-compose.yml      # Local multi-service dev (nginx proxy model)
└── render.yaml             # Render Blueprint (3 services)
```

## Getting started

### Prerequisites
- Node.js 18+
- .NET 10 SDK
- Python 3.11+
- A PostgreSQL database (e.g. Supabase) and an OpenAI API key

### 1. Client

```bash
cd client
npm install
cp .env.example .env.local   # then fill in values
npm run dev
```

Environment variables (`client/.env.local`):
```
VITE_API_URL=https://localhost:7236
VITE_AI_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=<your-google-oauth-client-id>
```

### 2. API (.NET)

```bash
cd server/FlightPlanner.API
dotnet run --project FlightPlanner.API
```

Configure DB connection (`DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`), `JWT_KEY`, `GOOGLE_CLIENT_ID`, `OPENWEATHER_API_KEY`, `AI_SERVICE_URL`, and optional SMTP (`EMAIL_*`) settings via environment variables / user secrets.

### 3. AI Service (Python)

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Environment variables: `DATABASE_URL`, `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-4o`).

Endpoints: `GET /flights`, `GET /flights/{id}`, `GET /analytics/smartest`, `POST /analytics/process`, `POST /ai/chat`, `GET /health`.

### Run everything with Docker

```bash
docker compose up --build
```

## Deployment

Production runs on [Render](https://render.com) via the [render.yaml](render.yaml) Blueprint (region: Frankfurt) as three services: `skywave-web` (static), `skywave-api` (Docker), and `skywave-ai` (Docker). Secrets are entered in the Render dashboard (`sync: false`) and are not committed.