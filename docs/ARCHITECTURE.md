# Architecture

Kyndill is a three-tier web application: a React single-page app, a Node.js HTTP and WebSocket API, and a PostgreSQL database. Frontend and backend are deployed independently; the database is colocated with the backend on the same VM to keep latency low and avoid managed-database costs in the prototype phase.

```
+----------------------+        HTTPS         +-------------------------+
|  Browser (React SPA) |  <----------------> |  Firebase Hosting (CDN) |
+----------------------+                      +-------------------------+
            |
            |  HTTPS (REST) + WSS (socket.io)
            v
+--------------------------------------------------------------+
|  GCP Compute Engine, e2-micro VM                             |
|                                                              |
|   +-------------------------+        +---------------------+ |
|   |  Node.js / Express API  |  ----> |  PostgreSQL 14+     | |
|   |  socket.io WebSockets   |        |  Unix socket / TCP  | |
|   |  node-cron jobs         |        |  Local volume       | |
|   +-------------------------+        +---------------------+ |
|                                                              |
+--------------------------------------------------------------+
```

## Tier 1: Frontend

- React 18 SPA, built with Vite, written in TypeScript.
- Hosted on **Firebase Hosting**, served from Google's edge network with HTTPS by default.
- Talks to the API over HTTPS for REST and over WSS for real-time updates (socket.io).
- No SSR. Static build artifacts only. All dynamic content fetched client-side.

## Tier 2: Backend

- Node.js 18+ HTTP server using Express.
- WebSocket server using socket.io, mounted on the same HTTP server.
- Background scheduled work using `node-cron` (daily habit rollover, pet health decay, reminder dispatch).
- Auth via JSON Web Tokens, passwords hashed with bcrypt, security headers via helmet, CORS scoped to the Firebase frontend origin.
- Deployed on a single **GCP Compute Engine `e2-micro` VM** running Ubuntu. Process supervised with `systemd`. TLS terminated by Caddy or nginx in front of the Node process.

## Tier 3: Database

- **PostgreSQL 14+**, self-hosted on the same `e2-micro` VM as the backend.
- The backend connects over the local loopback interface or a Unix domain socket.
- Daily logical backups (`pg_dump`) shipped to a GCS bucket via cron.
- Schema migrations are versioned SQL files in `backend/db/migrations/` (to be added).

## Why this shape

- **Two services, not microservices.** A single Node process serves REST and WebSockets, simplifying deploys and avoiding distributed-system overhead at this scale.
- **Database colocated.** At the prototype stage the cost of a managed Postgres (Cloud SQL) outweighs its benefit. Loopback connections are also faster than any managed offering. Migrating to Cloud SQL later is a connection-string change plus a `pg_dump`/`pg_restore`.
- **Static frontend on a CDN.** Firebase Hosting gives us free TLS, global edge caching, and atomic deploys. The frontend is fully decoupled from the API.
- **e2-micro chosen for cost.** GCP's always-free tier covers one `e2-micro` instance. Sufficient for the small concurrent user counts expected during early development.

## Deployment notes

- The backend reads configuration exclusively from environment variables. `.env` lives on the VM only; `.env.example` is committed and lists every required key.
- Frontend builds receive their API base URL via Vite environment variables at build time (`VITE_API_URL`).
- CORS on the backend whitelists only the production Firebase domain and `http://localhost:5173` for local development.

## Future considerations

- When concurrent users exceed what an `e2-micro` can handle, the path is: vertical bump to `e2-small`, then split database to Cloud SQL, then horizontally scale the API behind a load balancer.
- Realtime fanout is intentionally simple (single-process socket.io). A Redis adapter is the next step if we ever run multiple API instances.
