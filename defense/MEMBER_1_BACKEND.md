# Member 1 — Backend Engineer & Database Architect

**Owns:** Database schema (all tables, triggers, indexes), authentication (JWT + bcrypt + Google OAuth), habit completion transaction, streak calculation + freeze mechanics, reward engine (XP/coins/item drops/leveling), cron job (daily reset + pet health), API documentation. **Thesis sections:** technology comparison (1.3), architecture (3.1), implementation notes (3.3).

---

## 1. Opening statement (~30 seconds)

> "I built the data layer and the server-side core of Kyndill. That includes the PostgreSQL schema — 23 versioned migrations covering users, pets, habits, completions, streaks, items, inventory, friendships, gifts, focus sessions, notifications, and feedback — and the transactional logic that ties them together: the JWT + bcrypt + Google OAuth auth path, the habit completion transaction that updates streaks, rewards, pet stats, and the activity log in one atomic write, and the daily cron job that handles streak freezes and pet health at midnight UTC. This is the part of the system that has to be correct under concurrency, because the thesis claim — that a habit tracker can be both motivating and forgiving — depends on the streak/freeze logic being trustworthy."

---

## 2. Key features — explained

### A. Authentication
**Files:** [backend/src/services/authService.ts](../backend/src/services/authService.ts), [backend/src/routes/auth.ts](../backend/src/routes/auth.ts), [backend/src/lib/credentials.ts](../backend/src/lib/credentials.ts)

- **What it does.** Lets users register/login with email+password or sign in with Google, and protects every other route with a bearer JWT.
- **How it works.** Passwords are hashed with bcrypt at cost 12. Tokens are signed HS256 with a 7-day expiry, payload `{ sub: userId }`. Google sign-in uses `google-auth-library`'s `OAuth2Client.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })`. If a Google account's verified email matches an existing local account, the Google subject id is linked into the existing user row instead of creating a duplicate. Password rules: 10–72 chars, with at least one lower, one upper, one digit, one symbol.
- **Why this design.** bcrypt cost 12 is the current OWASP recommendation for interactive logins (~250ms/hash). HS256 is fine for a single-server prototype (no public key distribution needed). Verifying the Google ID token server-side, instead of just trusting a client-claimed email, is the whole point of OAuth integration.
- **Thesis tie-in.** Section 3.3 claims the system safely supports both local accounts and federated identity. The linking logic is the proof that we handle the realistic case where a user originally signs up with email and later uses Google.

### B. Habit completion transaction
**File:** [backend/src/services/habitService.ts](../backend/src/services/habitService.ts), `complete()` — the longest function in the codebase.

- **What it does.** When a user marks a habit done, this one function updates `habit_completions`, `streaks`, `users` (xp/level/coins + denormalized streak mirrors), `pets` (stats + derived health), and `activity_events` — and may insert a notification or roll an item drop. Everything either commits together or rolls back together.
- **How it works.** It opens a transaction and locks rows in deterministic order: today's `habit_completions` row `FOR UPDATE` (idempotency check), then `streaks` `FOR UPDATE` for that user, then `users` `FOR UPDATE`. For repeating habits (target_count > 1), intermediate check-ins just bump `completion_count`; rewards only fire when `completion_count = target_count`. Streak math compares `last_completion_date` to today: gap of 1 day → streak+1, gap of 0 → no change (extra completions same day), gap > 1 → consume a freeze if available, otherwise reset to 1.
- **Why this design.** Locking in a fixed order across the three tables avoids deadlocks. Putting the activity log and notifications inside the transaction means we never end up with a notification for a level-up that didn't actually happen. Side effects that we *cannot* roll back — socket emits, push pushes, friend fan-out — are deliberately deferred to after `COMMIT`.
- **Thesis tie-in.** Section 3.1 frames this as the "core flow" of the app. Section 3.3 cites it as the example of ACID guarantees in the implementation.

### C. Streak + freeze mechanics
- **What it does.** Streaks count consecutive active days. Freezes (max 3 per user, 35 coins each in shop, 2 free at signup) absorb a single missed day so the streak survives.
- **How it works.** Real-time path lives inside `complete()` (around lines 521–554). Background path lives in `cronService.runDailyRollover()` at `'0 0 * * *' UTC`: for each user whose `last_completion_date < CURRENT_DATE`, gap > 1 day either decrements `freeze_count` (preserved streak) or sets `current_streak = 0`. Each user is its own sub-transaction so one failure can't poison the sweep.
- **Why this design.** Two entry points are necessary because not every missed day comes with an explicit action — if the user just doesn't open the app, the cron job has to be the one that handles the gap. Storing freezes on `streaks.freeze_count` (not on `users`) keeps the row-level lock tight to one row per user.
- **Thesis tie-in.** Recoverability is explicitly part of the thesis problem statement ("recoverable rather than punitive"). Freezes are the concrete mechanic.

### D. Reward engine
**Files:** [backend/src/services/rewardService.ts](../backend/src/services/rewardService.ts), `computeHabitXp/Coins` in `habitService.ts`.

- **What it does.** Computes XP, coins, level-ups, and probabilistic item drops on each completion.
- **How it works.**
  - **XP** = `12 + (5 if weekly else 0) + min(18, floor(streak/2)) + (6 if streak%7==0 else 0)`
  - **Coins** = `7 + (4 if weekly else 0) + min(8, floor(streak/3)) + (5 if streak%7==0 else 0)`
  - **Level threshold:** `100 × N²` total XP.
  - **Item drop probability:** starts at 34%, climbs to 52% past streak 30.
  - **Drop rarity table:** 62% common consumable, 18% rare consumable, 13% common cosmetic, 5.5% rare cosmetic, 1.5% legendary cosmetic.
  - Cosmetic drops exclude items the user already owns.
- **Why this design.** Capping the streak bonus (max +18 XP, max +8 coins) prevents long-streak users from out-earning their way past the shop economy. The 7-day milestone bonus is the gamification "checkpoint" hit. Excluding owned cosmetics from drops keeps later drops feeling meaningful instead of duplicate.
- **Thesis tie-in.** Section 1.3 (technology comparison) discusses operant-conditioning critiques of gamification; the variable-ratio drop schedule with diminishing returns is the implementation response.

### E. Cron job
**File:** [backend/src/services/cronService.ts](../backend/src/services/cronService.ts)

- **What it does.** Runs once at 00:00 UTC. Resolves the previous day's missed habits, decrements freezes or resets streaks, and recalculates pet health.
- **How it works.** `node-cron` registers the job at process boot. Pet health is recomputed via `derivePetHealth(streak, stats)` = `round(min(100, careAvg × 0.55 + min(100, streak × 12) × 0.35 + min(12, streak × 2)))`. If health hits 0 the pet faints. Each user is processed in an isolated transaction; the sweep logs intact/frozen/reset/fainted/failed counts.
- **Why this design.** UTC midnight is the only globally unambiguous rollover point. Per-user transactions keep one bad row from aborting the whole batch.

---

## 3. Likely committee questions + answers

**Q1. Why bcrypt at cost 12 instead of argon2id?**
We chose bcrypt because the spec asked for it, it's the most widely-deployed password hash with predictable behavior across Node.js platforms, and cost 12 hits the ~250ms/hash sweet spot OWASP recommends for interactive logins. Argon2id is technically superior on memory hardness, but adopting it would have added a native build step. For a prototype thesis system the difference is not load-bearing.

**Q2. Why HS256 for JWTs instead of RS256?**
HS256 is symmetric — it needs one secret, which lives in the backend's `.env`. We have exactly one verifier (the same backend), so the asymmetric key distribution that justifies RS256 doesn't buy us anything here. If we deploy multiple services that need to verify tokens, RS256 becomes the right move and is a one-line change.

**Q3. What happens if two tabs complete the same habit at the same instant?**
The first request wins because of `SELECT … FOR UPDATE` on the `habit_completions` row for `(habit_id, user_id, today)`. The second request blocks until the first commits, then sees `completion_count = target_count` and returns 409 `ALREADY_COMPLETED`. Without that lock you'd get two `INSERT`s racing against the unique constraint, or a double-increment.

**Q4. Why denormalize `streak_current` onto `users` when `streaks` is the source of truth?**
The mirrored columns let profile lookups and the leaderboard skip a join. The application writes both inside the same transaction, so they can't drift unless a write succeeds in one place and not the other — and the transaction prevents exactly that. The [docs/DATABASE.md](../docs/DATABASE.md) design note flags this as a known maintenance cost and suggests a view-based replacement if it becomes painful.

**Q5. The `friends` table stores both `(a,b)` and `(b,a)` — isn't that just duplication?**
Yes, by row count, but it makes every "my friends" query a single `WHERE user_id = $me`, which uses the primary-key index and stays direction-free. The alternative — `(min, max)` only — needs `OR` predicates and worse plans on large social graphs. The app layer writes both rows inside the accept transaction.

**Q6. Why `BEFORE UPDATE` on the pet stage trigger instead of `AFTER UPDATE` as the spec asked?**
`BEFORE UPDATE` lets the trigger mutate `NEW.stage` in place. `AFTER UPDATE` would have to issue another `UPDATE` and that would recurse onto its own trigger. The observable behavior is identical: by the time anyone reads the row, `stage` matches `total_habits_completed`. The DATABASE.md design notes call this out explicitly.

**Q7. What's the threat model for Google sign-in?**
We verify the ID token's signature against Google's JWKS via `OAuth2Client.verifyIdToken`, with `audience` pinned to our `GOOGLE_CLIENT_ID`. We require `email_verified` to be true before we trust the email for linking. We don't accept access tokens — only ID tokens — because access tokens don't carry the audience claim we'd need to bind the credential to our app.

**Q8. How do you prevent a user from buying more freezes than the cap?**
Both the shop service and the schema enforce it. `streaks.freeze_count` is a `SMALLINT` constrained 0..3, and `shopService.buyStreakFreeze` reads the current count with `FOR UPDATE` before incrementing, raising `409 FREEZE_LIMIT_REACHED` at 3. A race where two purchases sneak through is impossible because the first transaction holds the row lock until commit.

**Q9. What happens if the cron job is down for a day?**
Nothing breaks — the next completion will re-derive the gap from `last_completion_date` and consume a freeze (or reset) the same way the cron would have. The cron is a convenience to keep pet health and streak state visible on the dashboard before the user acts, not the authority on streaks. The authority is `last_completion_date` plus the gap math, which runs on every completion.

**Q10. What's the biggest limitation of the backend right now?**
There's no rate limiting at the edge yet — we rely on the Postgres unique constraints and `FOR UPDATE` locks to prevent functional abuse, but a determined attacker could still hammer the login endpoint. We also assume the backend is a single process; if we scale out, socket.io needs an adapter and the cron job needs leader election. Both are documented in [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) as known follow-ups.

---

## 4. Things to point to in the demo

- **[backend/db/migrations/](../backend/db/migrations/)** — open the folder; "23 sequential migrations, each runs in a transaction, recorded in `schema_migrations` so we never re-apply."
- **[010_triggers.sql](../backend/db/migrations/010_triggers.sql)** — `trg_users_init_resources` ("a new user gets a pet and a streaks row with 2 starter freezes, atomically") and `trg_pets_update_stage` ("pet evolution stage is a derived value the database maintains").
- **[backend/src/services/habitService.ts](../backend/src/services/habitService.ts) — `complete()`** — scroll through the function: "BEGIN, lock completion row, lock streak row, compute gap, decide freeze vs reset, lock user, recompute XP/level, apply pet effects, log activity, COMMIT, then post-commit socket emits."
- **[backend/src/services/cronService.ts](../backend/src/services/cronService.ts)** — show the schedule and the per-user transaction loop.
- **[backend/src/services/authService.ts](../backend/src/services/authService.ts) — `googleSignIn()`** — walk through verify → link-or-create → token issue.
- **[docs/DATABASE.md](../docs/DATABASE.md) "Design notes" section** — call out the three documented denormalization decisions; this signals you understood the trade-offs.

---

## 5. Tricky questions to prepare for

- **"Your streak mirror on `users` could drift — prove it can't."** Honest answer: the application is the only writer to both, the writes are inside the same `BEGIN…COMMIT`, and we don't expose any path that updates one without the other. We have not added a periodic reconciliation job because the invariant is enforced at write time. If it ever drifts, the cron sweep would resync it on the next missed day.
- **"What's stopping me from re-using an old JWT after I changed my password?"** Honest answer: nothing, in the current code — there is no token revocation list. JWTs expire after 7 days. For a prototype this is the standard trade-off; the production-grade fix is a `token_version` column on `users` that the JWT carries and the middleware checks. This is an accepted limitation and we'd call it out in the limitations section.
- **"What if `Math.random()` in the item drop isn't actually uniform?"** It's good enough for our purposes — it's V8's xorshift128+, statistically uniform for non-crypto use. We don't need cryptographic randomness because drop manipulation isn't a security concern.
- **"Your password rules force a symbol — isn't that anti-NIST guidance?"** Yes, NIST SP 800-63B prefers length over composition rules. The spec we were given required composition; we'd happily relax that. The length minimum of 10 is the stronger lever here.
- **"How do you handle DST and time zones for streaks?"** All dates are computed against UTC. We accept that someone completing at 23:30 local time on a UTC-positive day can have their "day" already roll over. Mitigating this properly requires user-supplied timezone, and we treat it as future work.

---

## 6. What NOT to say

- Don't claim "fully ACID across the whole flow" — socket emits, web pushes, and friend fan-out happen *after* commit and are best-effort by design.
- Don't claim the system is "secure" in absolute terms. Say "the threat model we addressed" and name the OWASP items you covered (auth, input validation, parameterized SQL, helmet headers).
- Don't promise the cron job is fault-tolerant in a multi-instance deploy. It isn't yet.
- Don't get drawn into "why not Prisma/Drizzle". We picked `pg` because the spec required raw SQL and the schema is small; this is a defensible choice, not a weakness.
- Don't say item drops are "random" without context — they're a designed variable-ratio schedule.
