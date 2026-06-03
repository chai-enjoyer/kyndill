# Kyndill

A habit tracking web app built around a virtual pet companion. Habits are small flames kept alive daily; the pet's health and mood reflect consistency, streak momentum, and care stats. Designed to be recoverable rather than punitive: missed days can trigger gentle reflection and streak freezes instead of shame loops.

The name is Old Norse for *candle* or *small torch*.

## Tech stack

- **Frontend.** React 18, Vite, TypeScript, React Router v6, Axios, plain CSS.
- **Backend.** Node.js 18+, Express, TypeScript, PostgreSQL via `pg`, bcrypt, jsonwebtoken, Google OAuth verification, cors, helmet, dotenv, node-cron, socket.io.
- **Shared.** TypeScript types consumed by both frontend and backend; no runtime dependencies.
- **Tooling.** npm workspaces monorepo.

## Repository layout

```
kyndill/
  frontend/   React + Vite client
  backend/    Express API + WebSocket server
  shared/     TypeScript types shared across the stack
  docs/       Architecture, API, database, diagrams, and data/logging docs
```

## Current feature set

- Email/password auth, Google sign-in, profile editing, avatar upload, notification preferences, and research consent persistence.
- Onboarding with pet naming/species choice and starter habit selection.
- Habit CRUD, drag reorder, daily/weekly schedules, time windows, and repeated same-day check-ins.
- Dashboard with pet panel, streak freezes, activity feed, item drops, feedback prompts, progress, and real-time updates.
- Pet care, consumables, sprite-backed cosmetics, inventory, shop purchases, and streak-freeze buying.
- Pet recovery: a companion only faints when its health hits zero, with low-stat care prompts and three ways back — feed it, complete a habit, or spend a streak freeze to revive instantly.
- Friends, incoming/outgoing requests, gifts, friend profiles, notifications, and leaderboards.
- Focus timer with real ambient audio, volume control, completion reward, and optional rating.
- Progress/insights and recovery reflection for evaluation-oriented behavioral data.

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- PostgreSQL 14+ running locally (or a connection string to a remote instance)

## Setup

Install all workspaces from the repo root:

```bash
npm install
```

Build the shared types package so frontend and backend can resolve it:

```bash
npm run build:shared
```

Copy backend environment template and fill in real values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

For Google sign-in, create an OAuth Web client in Google Cloud and set the same client ID in both environments:

```bash
# backend/.env
GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com

# frontend/.env
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

Add `http://localhost:5173` to the OAuth client's authorized JavaScript origins for local testing.

Create the PostgreSQL database, then apply migrations:

```bash
npm run migrate --workspace backend
```

On Windows, if `createdb` is not on your PATH, create the database in pgAdmin or use the PostgreSQL bin path directly, then make sure `DATABASE_URL` in `backend/.env` points to that database.

## Running locally

Two terminals, one per process:

```bash
# terminal 1
npm run dev:backend

# terminal 2
npm run dev:frontend
```

The frontend serves on `http://localhost:5173`. The backend serves on `http://localhost:3000` by default.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): system overview and deployment topology.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md): Google Cloud and Firebase deployment runbook.
- [`docs/DECISIONS.md`](docs/DECISIONS.md): architecture decision log.
- [`docs/API.md`](docs/API.md): HTTP and WebSocket API reference.
- [`docs/DATABASE.md`](docs/DATABASE.md): PostgreSQL schema and migration workflow.
- [`docs/DIAGRAMS.md`](docs/DIAGRAMS.md): Mermaid/PlantUML diagram source for thesis use.
- [`docs/TESTING.md`](docs/TESTING.md): test stack, commands, and coverage plan.
- [`docs/USER_DATA_AND_LOGS.md`](docs/USER_DATA_AND_LOGS.md): user data, storage, logs, privacy, and evaluation notes.
- [`.github/COMMIT_CONVENTION.md`](.github/COMMIT_CONVENTION.md): commit message format.
- [`PRODUCT.md`](PRODUCT.md): product strategy, brand, and design principles.
