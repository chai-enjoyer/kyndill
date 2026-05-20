# Member 3 — Frontend Engineer & Social Systems Developer

**Owns:** All React frontend pages and routing, friend request system, gift exchange, leaderboard, activity feed, Socket.io real-time notifications, profile + privacy/visibility settings. **Thesis sections:** literature review social parts (1.1.4), methodology (Chapter 2), evaluation (3.4).

---

## 1. Opening statement (~30 seconds)

> "I built the entire React frontend — 12 pages, the routing/auth shell, the Socket.io real-time layer — and the server-side social systems behind them: friend requests with double-direction `friends` edges, gift exchange, the leaderboard with privacy filtering, the activity feed, and profile/visibility settings. The thesis question I addressed in chapter 2 (methodology) and 3.4 (evaluation) is whether social features in a habit tracker can support consistency without becoming a performance arena. The implementation answer is: private-by-default visibility, redacted activity that shows momentum without exposing the specific habits, and friend-only gifting that's rate-limited."

---

## 2. Key features — explained

### A. React routing + auth shell
**Files:** [frontend/src/App.tsx](../frontend/src/App.tsx), [main.tsx](../frontend/src/main.tsx), [context/AuthContext.tsx](../frontend/src/context/AuthContext.tsx)

- **What it does.** Renders the right page based on URL and the user's auth + onboarding state.
- **How it works.** `BrowserRouter` wraps three context providers (`AuthProvider`, `ToastProvider`, `SocketProvider`). Three guard components: `RequireAuth` (redirects to `/login` if no token, or `/onboarding` if `pet.initialized_at` is null), `RequireAuthForOnboarding` (the inverse), and `PublicOnly` (redirects authed users away from login/register). All protected routes share a common `AppShell` layout with side nav on desktop and bottom nav on mobile. Unknown routes fall through to `/`.
- **Why this design.** Three guards instead of one keeps each redirect rule single-responsibility — onboarding logic doesn't bleed into login logic. Context for auth state means the JWT and user object are available without prop-drilling.

### B. Socket.io real-time layer
**Files:** [frontend/src/context/SocketContext.tsx](../frontend/src/context/SocketContext.tsx), [backend/src/socket/socketHandler.ts](../backend/src/socket/socketHandler.ts)

- **What it does.** Pushes friend requests, gift receipts, activity updates, item drops, and level-ups to the user without polling.
- **How it works.** Frontend creates a single socket on login: `io(SOCKET_URL, { auth: { token } })`. Backend handshake middleware reads the token from `auth.token`, `query.token`, or `Authorization` header (fallback chain), verifies with the same `verifyToken` used by REST middleware, attaches `socket.data.userId`, and joins the socket to `user:<id>`. Every server-emit goes through `emitToUser(userId, event, payload)` which targets that room. Listeners on the frontend route events to toast messages and refetches.
- **Why this design.** One room per user is the simplest topology that still supports multi-device — if the user has the dashboard open in two tabs, both receive the event. Sharing the verification path with REST means there's exactly one way a token gets accepted.

### C. Friend request system
**Files:** [backend/src/services/socialService.ts](../backend/src/services/socialService.ts), [backend/src/routes/social.ts](../backend/src/routes/social.ts), [frontend/src/pages/FriendsPage.tsx](../frontend/src/pages/FriendsPage.tsx)

- **What it does.** Send a request to a username, receive in-app + push notifications, accept/reject, and remove.
- **How it works.** `POST /api/social/friends/request` validates not-self, not-already-friends, and no-pending-request; then UPSERTs into `friend_requests` (so a previously rejected request can be re-issued). Accept handler runs a transaction that flips the request to `accepted`, inserts both `(me, them)` and `(them, me)` into `friends`, records a `friendship` activity, then emits `friend_request_responded` and a notification + push to the requester, and emits `activity_updated` to me and to all my friends.
- **Why this design.** Both-direction edges make every "who are my friends" query a `WHERE user_id = $me` against the PK index — direction-free and fast. UPSERT-on-conflict for `friend_requests` lets a user change their mind after a rejection without bumping into a unique constraint.

### D. Gift exchange
**Functions:** `socialService.sendGift`, `socialService.acceptGift`

- **What it does.** A friend can send any consumable from their inventory to another friend, with an optional 280-char message. Recipient accepts it into their own inventory.
- **How it works.** Send path verifies friendship, verifies sender owns the consumable, enforces a "max one gift per friend per UTC day" rate limit, opens a transaction to decrement the sender's inventory + insert a `gifts` row + insert a notification, then emits a socket event, an `activity_updated`, and a push. Accept path runs a separate transaction that UPSERTs into the recipient's inventory and flips `is_accepted=TRUE` so it can't be claimed twice.
- **Why this design.** Two-step give-and-accept means accidental gifts aren't auto-consumed — recipient confirms. The same-day rate limit prevents inventory-laundering between friends.

### E. Leaderboard
**Files:** [backend/src/services/leaderboardService.ts](../backend/src/services/leaderboardService.ts), [frontend/src/pages/LeaderboardPage.tsx](../frontend/src/pages/LeaderboardPage.tsx)

- **What it does.** Two scopes: `/friends` (me + accepted friends, top 50) and `/global` (top 100, public-visibility users only). Ordered by `level DESC, xp DESC, display_name ASC`.
- **How it works.** SQL is straightforward; the privacy filter on global is `WHERE visibility = 'public'` — non-public users are simply absent. The friends scope always includes the requester so they see their own rank, regardless of their own visibility.
- **Why this design.** The thesis evaluation needed a social comparison feature but the literature (Festinger, social comparison theory) warns it can demotivate the bottom of the distribution. Keeping global behind an explicit `visibility = 'public'` opt-in is the mitigation.

### F. Activity feed
**File:** [backend/src/services/activityService.ts](../backend/src/services/activityService.ts)

- **What it does.** Shows the 30 most recent events from you + your accepted friends. Types: `habit_completed`, `purchase`, `friendship`, `level_up`, `gift_sent`.
- **How it works.** A single query joins `activity_events` with `users`, filters to the user or any friend, and orders by `created_at DESC`. A redaction function strips `habit_id` and `habit_name` from any friend-visible `habit_completed` metadata — friends know you completed *something*, but not what.
- **Why this design.** The habit name itself can be very personal ("therapy at 4pm", "go outside today"). Showing the type without the specifics lets friends celebrate momentum without exposing privacy.

### G. Profile + privacy visibility
- **What it does.** Three-level visibility: `public` (in global leaderboard, stats visible), `friends` (stats visible to friends only), `private` (default — only display name, username, level shown).
- **How it works.** Enforced at three layers: `leaderboardService` filters global on `visibility = 'public'`; `socialService`'s friend-list query nulls out `streak_current` when the friend is private; `userService.getFriendProfile` returns `streak_current` and `total_habits_completed` as `null` for private friends. Activity feed redaction is independent of visibility — it always strips habit names for friend-visible events.

---

## 3. Likely committee questions + answers

**Q1. How do you keep frontend state consistent with the backend?**
Each domain area has a custom hook (`useHabits`, `usePet`, `useSocial`, `useShop`, etc.) that owns its fetch + cache + refetch logic. Socket events trigger targeted refetches — e.g., `gift_received` triggers `useSocial.refetchGifts()`. We deliberately did not introduce a heavy state library like Redux because the data model is small and per-page.

**Q2. Why React Router v6 instead of Next.js?**
Kyndill is an SPA, not a content site. We don't need SSR for SEO, we don't need file-based routing, and we don't need server components. React Router gives us exactly the routing we need with no server runtime dependency, which keeps the frontend deployable as a static bundle behind Firebase Hosting.

**Q3. Why localStorage for the JWT?**
We accept the XSS-vs-CSRF trade-off in localStorage's favor for this app. Cookies would require CSRF protection and a backend-set Secure+HttpOnly path that doesn't compose with our cross-origin (Firebase Hosting → Compute Engine API) deployment. localStorage works under that topology with simpler code. We mitigate XSS by sanitizing every user-rendered string and using React's default escaping.

**Q4. What's your reconnection strategy for socket.io?**
We rely on socket.io's built-in reconnection (default exponential backoff). Because the handshake re-runs the JWT verification, an expired token gets you a 401 on reconnect and the auth context clears. We also rehydrate notifications from REST on every page mount, so a missed socket event doesn't silently disappear — it shows up the next time the user opens the bell.

**Q5. How does the activity feed prevent leaking private habits?**
Two layers. First, friend-visibility filtering happens at the query: you only see events from your accepted friends, not arbitrary users. Second, the `redactForViewer` function in `activityService` deletes `habit_id` and `habit_name` from any friend-visible `habit_completed` event. So a friend sees "Iris completed a habit" without learning *which* one.

**Q6. Why do friend rows go both directions?**
For query simplicity and index efficiency. With `(a,b)` and `(b,a)` rows, every "my friends" query is `WHERE user_id = $me` and uses the PK directly. With single-direction rows you need `OR` predicates and your friend-of-friend joins get ugly fast. The cost is double the row count and a transaction at accept time to keep them in sync.

**Q7. Why a 1-gift-per-friend-per-day rate limit?**
Two reasons. First, without it, two users could trade items back and forth to inflate inventories (especially rare consumables). Second, friction is part of the social design — gifting once a day is meaningful; gifting twenty times a day is spam.

**Q8. Why is the global leaderboard opt-in (private by default)?**
The thesis evaluation in 3.4 examined whether social features hurt vulnerable users. The literature on social comparison theory (Festinger, 1954, and modern follow-ups on social media's effect on self-esteem) is clear that downward comparisons can hurt motivation in users below the median. Making the global leaderboard explicitly opt-in via `visibility='public'` puts users in control.

**Q9. How do you handle a long inbound notification list?**
The bell only shows unread notifications. `PUT /api/notifications/read` bulk-marks them. We didn't paginate because the realistic ceiling is dozens, not thousands, and the cron job doesn't generate new notification rows — every notification is the result of a user-driven event with rate limits already in place.

**Q10. What's the biggest limitation of the social system?**
There's no block/mute. A user who wants to cut off contact from another user can remove the friendship, but if the other user keeps sending friend requests, all we do is fail-soft. Real platforms have a block list with a server-side filter; we deliberately scoped that out for the prototype because the user population is small and known.

---

## 4. Things to point to in the demo

- **[frontend/src/App.tsx](../frontend/src/App.tsx)** — show the three guard components and the route tree.
- **[frontend/src/context/SocketContext.tsx](../frontend/src/context/SocketContext.tsx)** — "single socket, auth in handshake, events route into hooks via callbacks."
- **[backend/src/socket/socketHandler.ts](../backend/src/socket/socketHandler.ts)** — show the handshake middleware (token fallback chain), the `user:<id>` room join, and `emitToUser`.
- **[backend/src/services/socialService.ts](../backend/src/services/socialService.ts) — `respondToFriendRequest()`** — walk through the transaction: flip the request, two `INSERT INTO friends`, record activity, commit; *then* emit socket + push.
- **[backend/src/services/activityService.ts](../backend/src/services/activityService.ts) — `redactForViewer()`** — point at the few lines that strip habit details for friend views.
- **[backend/src/services/leaderboardService.ts](../backend/src/services/leaderboardService.ts)** — show `WHERE visibility='public'` for global, and how friends scope always includes the requester.
- **Live demo** — open the app in two browser windows logged in as two test users. Send a friend request from window A; show the toast appearing in window B in real time. Accept, send a gift, watch the activity feed update.

---

## 5. Tricky questions to prepare for

- **"What if a friend has visibility=public on their profile but is in my friends list — which rules govern what I see?"** Friend-list and friend-profile queries treat them as a friend (so stats are visible), and global leaderboard also shows them because they're public. The rules are additive — public ≥ friends ≥ private — so visibility never *hides* something from a friend that a stranger could see.
- **"Your activity-feed redaction depends on the application layer, not the database. Isn't that a leak waiting to happen?"** Yes, in principle — a future endpoint that returns the same rows without going through the redaction function would leak. The mitigation is that all reads of `activity_events` route through `activityService.listForUser`, which is the only function that does the join. If we added a second reader, it would have to go through the same path.
- **"You use socket.io, not native WebSockets. Why?"** Socket.io gives us automatic reconnection, room semantics, and HTTP-fallback for environments where WebSockets are blocked. The cost is a slightly heavier client (~30KB) and protocol overhead. For a habit tracker with a few events per minute, that's the right trade-off.
- **"Your friend-request UPSERT means a rejection can be retried indefinitely. Isn't that harassment-enabling?"** It's the same behavior as Twitter/Instagram follows — there's no way to permanently block a re-request without a block list. We acknowledge this; block is documented future work.
- **"Best-effort socket emits — what happens if a critical event is dropped?"** Database state is the source of truth. Every event has a database counterpart (notification row, activity event, gift row, etc.) that the page rehydrates from REST on mount. So a dropped socket event becomes a missed *toast*, not a missed *state change*.

---

## 6. What NOT to say

- Don't say "real-time" without qualifying it — say "best-effort real-time with REST rehydration as the consistency floor."
- Don't claim the leaderboard is "fair" — say it's "opt-in for global visibility, with rank ordered deterministically by level then xp then name." Fairness invites a long methodology argument you can't win in a Q&A.
- Don't apologize for the lack of a block feature — frame it as scoped-out for the prototype with documented future work.
- Don't oversell the activity-feed redaction — be precise: it strips habit *name* and *id*, not the event type itself.
- Don't say "we use Redux" or any other state library you don't actually use; the codebase is React Context + hooks.
- Don't get drawn into "why not GraphQL" — REST is fine here, the API surface is small, and we have one client.
