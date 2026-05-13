# Decision log

Architecture Decision Records (ADRs) for Kyndill. Each entry captures one significant decision: what we chose, what we rejected, and why.

Format per entry:

```
## NNNN. Title

- Status: proposed | accepted | superseded by NNNN
- Date: YYYY-MM-DD

### Context
What is the situation that requires a decision?

### Decision
What did we choose?

### Consequences
What changes because of this decision? What did we give up?
```

---

## 0001. Monorepo with npm workspaces

- Status: accepted
- Date: 2026-05-11

### Context

The project has a React frontend, a Node.js backend, and a set of TypeScript types both consume. The team is small (one engineer at the start). We need a layout that keeps the frontend, backend, and shared types in lockstep without introducing a heavy tool like Nx or Turborepo.

### Decision

Use a single Git repository with three workspaces (`frontend`, `backend`, `shared`) coordinated by npm workspaces.

### Consequences

- Shared TypeScript types live in one place and are imported by both sides as `@kyndill/shared`.
- A single `npm install` at the root installs all workspace dependencies.
- We accept npm workspaces' weaker dependency-hoisting compared to pnpm; this is acceptable at the current scale and avoids introducing a non-default package manager.
- If build orchestration grows complex (parallel builds, remote caching), we can layer Turborepo or Nx on top later without restructuring the directories.

---

## 0002. PostgreSQL self-hosted on the same VM as the API

- Status: accepted
- Date: 2026-05-11

### Context

The product needs a relational database for user accounts, habits, completions, pet state, and social graph data. Cloud SQL is the obvious managed choice but its smallest instance costs roughly the same as a non-trivial VM, and at prototype scale we expect single-digit concurrent users.

### Decision

Run PostgreSQL 14+ on the same GCP `e2-micro` VM that hosts the API process, connecting over loopback or a Unix socket.

### Consequences

- Zero database hosting cost while we are inside the GCP always-free tier.
- Latency between API and database is effectively zero.
- Backups are our responsibility: a daily `pg_dump` cron pushing to a GCS bucket.
- A VM-level failure takes down both tiers. Acceptable for prototype; not acceptable past early access.
- Migrating to Cloud SQL later is a `pg_dump` / `pg_restore` plus a connection-string change.

---

## 0003. Plain CSS, no Tailwind, no component library

- Status: accepted
- Date: 2026-05-11

### Context

Kyndill's brand is deliberately non-SaaS: warm, considered, nurturing. Tailwind's utility-class density and the visual conventions of off-the-shelf component libraries (shadcn/ui, MUI, Chakra) pull designs toward a recognizable house style that conflicts with the brand's anti-references.

### Decision

Use plain CSS, written to match the design system captured in `DESIGN.md`. No utility-class framework, no off-the-shelf component library.

### Consequences

- Slower initial component delivery; faster route to a distinct visual identity.
- Tokens live in CSS custom properties so they can be themed without a runtime style engine.
- Accessibility primitives (focus rings, ARIA wiring) are our responsibility, not the component library's.

---

## 0004. Firebase Hosting for the frontend

- Status: accepted
- Date: 2026-05-11

### Context

The frontend is a static SPA. It needs HTTPS, a CDN, and a deploy pipeline. Options include Vercel, Netlify, Cloudflare Pages, Firebase Hosting, and a GCS bucket behind a load balancer.

### Decision

Use Firebase Hosting.

### Consequences

- The frontend deploys with `firebase deploy --only hosting`, atomic and revertible.
- Free TLS, global edge caching, generous free tier.
- We stay inside the Google Cloud ecosystem, consistent with the API VM living on GCP.
- We accept some lock-in around the Firebase CLI for deploys; mitigated by the build artifact itself being portable static files.

---

## 0005. Persist product preferences and consent server-side

- Status: accepted
- Date: 2026-05-13

### Context

Notification preferences and research consent are part of account state, not only local UI state. They need to follow the user across browsers and should be available to backend services that filter notifications or generate evaluation exports.

### Decision

Store notification preferences in `users.notification_prefs` as JSONB and research participation in `users.research_consent` as a boolean. The frontend reads and updates both through `/api/user/profile`.

### Consequences

- Preferences now survive device changes and browser storage clears.
- The backend can apply preferences when listing notifications.
- Consent is represented in the same persistent record as the user account.
- JSONB keeps preferences flexible, but validation remains in the route layer.

---

## 0006. Use append-only activity and feedback event tables

- Status: accepted
- Date: 2026-05-13

### Context

The thesis evaluation needs behavioral metrics and user feedback. The product also needs an activity feed for habits, purchases, friendships, level-ups, and gifts.

### Decision

Store product activity in `activity_events` and explicit feedback/recovery data in `feedback_events`. Use JSONB metadata for event-specific fields.

### Consequences

- The dashboard can show a live activity feed without reconstructing every event from domain tables.
- Progress/insights can count feedback and recovery reflection records.
- Friend-visible activity can be redacted at read time.
- Free-text feedback requires careful anonymization before research export.

---

## 0007. Keep social features opt-in but make level public

- Status: accepted
- Date: 2026-05-13

### Context

Friends need enough visible information to recognize each other's progress, but habit names and detailed behavioral history can be sensitive.

### Decision

Keep profile visibility controls for streak and total habit history, but expose level as public profile information. Global leaderboard participation still requires `visibility = 'public'`.

### Consequences

- Friend cards and friend profiles no longer contradict each other about level.
- Users can keep habit/streak details private while still having a light social identity.
- The app should avoid exposing habit names in friend-visible feeds unless privacy rules change.

---

## 0008. Use Mermaid and PlantUML source diagrams in docs

- Status: accepted
- Date: 2026-05-13

### Context

The thesis needs architecture, ERD, use case, sequence, state, and deployment diagrams. The diagrams should be maintainable in source control instead of living only as exported images.

### Decision

Keep diagrams in `docs/DIAGRAMS.md` using Mermaid for architecture, ERD, sequence, state, and deployment diagrams, and PlantUML for the use case diagram.

### Consequences

- Diagrams can render in Markdown-compatible tools and be updated with code reviews.
- The deployment diagram remains explicitly marked as planned until final infrastructure is verified.
- Exported images for the thesis can be generated from the same source text.
