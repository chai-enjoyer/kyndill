# Architecture

Kyndill is a three-tier web application: a React single-page app, a Node.js HTTP/WebSocket API, and a PostgreSQL database. The current codebase supports local development and a planned Google Cloud deployment.

```
+----------------------+        HTTPS         +-------------------------+
|  Browser (React SPA) |  <----------------> |  Firebase Hosting (CDN) |
+----------------------+                      +-------------------------+
            |
            |  HTTPS REST + WSS socket.io
            v
+--------------------------------------------------------------+
|  GCP Compute Engine VM                                       |
|                                                              |
|   +-------------------------+        +---------------------+ |
|   |  Node.js / Express API  |  ----> |  PostgreSQL 14+     | |
|   |  socket.io WebSockets   |        |  Local or TCP conn. | |
|   |  node-cron jobs         |        |  Versioned schema   | |
|   +-------------------------+        +---------------------+ |
|                                                              |
+--------------------------------------------------------------+
```

## Frontend

- React 18 SPA built with Vite and TypeScript.
- React Router handles dashboard, habits, pet, shop, friends, leaderboard, focus, progress, profile, settings, onboarding, login, and registration pages.
- Styling uses plain CSS with design tokens, responsive desktop/mobile layouts, page transitions, skeleton loading states, and reduced-motion support.
- The app calls the backend through Axios using `VITE_API_URL`.
- A JWT is stored in browser `localStorage` under `kyndill_token` and attached as `Authorization: Bearer <token>`.
- socket.io is used for live social, reward, and activity updates.
- Ambient focus sounds live under `frontend/public/ambient`.
- Pet, cosmetic, and consumable visuals use local sprite/SVG assets.

## Backend

- Node.js 18+ HTTP server using Express and TypeScript.
- REST route groups:
  - `/api/auth`
  - `/api/habits`
  - `/api/pet`
  - `/api/shop`
  - `/api/inventory`
  - `/api/social`
  - `/api/focus`
  - `/api/user`
  - `/api/leaderboard`
  - `/api/notifications`
  - `/api/feedback`
  - `/api/progress`
  - `/api/recovery`
- Authentication uses JWT, bcrypt password hashes, and optional Google OAuth ID token verification.
- `helmet` applies security headers; CORS is scoped by `FRONTEND_URL`.
- socket.io runs on the same HTTP server and authenticates handshakes with the same JWT verification path.
- `node-cron` runs the daily UTC rollover for streak freezes, streak resets, and pet health recalculation.
- Application activity and feedback are stored in database tables, not only process logs.

## Database

- PostgreSQL 14+.
- Schema changes are versioned SQL migrations in `backend/db/migrations/`.
- Migrations are applied with:

```bash
npm run migrate --workspace backend
```

- Core tables cover users, pets, habits, completions, streaks, items, inventory, cosmetics, friends, gifts, focus sessions, notifications, activity events, and feedback events.
- User-owned records generally cascade on account deletion.
- JSONB is used for flexible metadata and preferences: notification metadata, activity metadata, habit weekday settings, notification preferences, and feedback/recovery context.

## Real-Time Events

socket.io authenticates each connection and joins the socket to a private room named `user:<id>`. Services emit events to that room for:

- friend requests and responses
- gift receipt
- habit completion fanout to friends
- item drops
- level-ups
- activity feed refreshes

Socket delivery is best effort. Database transactions do not roll back if an emit fails.

## Background Jobs

The backend currently registers a daily cron job at `0 0 * * *` UTC. It:

- checks users whose last completion date is before today
- consumes a streak freeze when a longer gap is recoverable
- resets streaks when no freeze is available
- recalculates pet health using streak momentum and pet stats
- logs a summary to the backend process output

Passive pet stat decay also runs when pet state is read, so pet state changes over time as users return.

## Planned Google Cloud Deployment

The intended deployment is:

- Firebase Hosting for the static frontend build.
- Compute Engine VM for the Node.js API, socket.io, and cron.
- PostgreSQL on the same VM for prototype cost control, with an easy future path to Cloud SQL.
- Caddy or nginx in front of Node for TLS termination on the API VM.
- Daily `pg_dump` backups to a Cloud Storage bucket.

Deployment details should be verified against the final VM/Firebase configuration before thesis submission. No production deployment config is currently committed in the repository.

## Local Development

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Default frontend API URL: `http://localhost:3000`
- Backend configuration lives in `backend/.env`.
- Frontend configuration lives in `frontend/.env`.

## Why This Shape

- A single API process keeps REST, WebSocket, and cron behavior simple at prototype scale.
- PostgreSQL fits the relational nature of accounts, habits, completions, rewards, social edges, and evaluation data.
- Static frontend hosting keeps the client deploy cheap and independent from backend deploys.
- The design is intentionally easy to move later: Cloud SQL can replace local PostgreSQL with a connection-string change plus dump/restore, and socket.io can use an adapter if multiple API instances are introduced.
