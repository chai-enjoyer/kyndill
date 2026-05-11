# Kyndill

A habit tracking web app built around a virtual pet companion. Habits are small flames kept alive daily; the pet's emotional state reflects your consistency. Designed to be recoverable rather than punitive: missing a day is a quiet welcome back, not a counter reset.

The name is Old Norse for *candle* or *small torch*.

## Tech stack

- **Frontend.** React 18, Vite, TypeScript, React Router v6, Axios, plain CSS.
- **Backend.** Node.js 18+, Express, TypeScript, PostgreSQL via `pg`, bcrypt, jsonwebtoken, cors, helmet, dotenv, node-cron, socket.io.
- **Shared.** TypeScript types consumed by both frontend and backend; no runtime dependencies.
- **Tooling.** npm workspaces monorepo.

## Repository layout

```
kyndill/
  frontend/   React + Vite client
  backend/    Express API + WebSocket server
  shared/     TypeScript types shared across the stack
  docs/       Architecture, decisions, API reference
```

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
```

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
- [`docs/DECISIONS.md`](docs/DECISIONS.md): architecture decision log.
- [`docs/API.md`](docs/API.md): HTTP and WebSocket API reference.
- [`.github/COMMIT_CONVENTION.md`](.github/COMMIT_CONVENTION.md): commit message format.
- [`PRODUCT.md`](PRODUCT.md): product strategy, brand, and design principles.
