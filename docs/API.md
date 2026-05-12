# API reference

HTTP and WebSocket contract for the Kyndill backend. The full set of v1 routes is implemented across auth, habits, pet, shop, inventory, social, focus, leaderboard, and notifications. The `/api/user` surface (profile read/update + public profile lookup) is the only group still returning `501`.

## Base URL

- Local: `http://localhost:3000`
- Production: TBD

## Conventions

- All requests and responses are JSON.
- Timestamps are ISO 8601 in UTC; dates are `YYYY-MM-DD`.
- IDs are UUIDs (string).
- Authentication is via JSON Web Tokens passed as `Authorization: Bearer <token>`. Tokens are signed with HS256 and expire after 7 days.
- Errors follow the shape:
  ```json
  { "error": { "code": "STRING_CODE", "message": "Human readable" } }
  ```
- Validation errors include an `issues` array describing each failing field.

## Authentication scope

Public endpoints (no token required):

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`

Every other endpoint under `/api/*` requires a valid bearer token. Missing or expired tokens return `401 UNAUTHORIZED`.

## Health

| Method | Path      | Auth | Description           |
| ------ | --------- | ---- | --------------------- |
| GET    | `/health` | no   | Service liveness probe (returns `{ "status": "ok" }`). |

## Auth (`/api/auth`)

JWT auth uses HS256 with a 7-day expiry. Tokens carry only `sub` (user id) plus standard `iat` / `exp` claims.

### POST `/register` (public)

Create a local-credentials account. The username is generated from the email's local part; collisions append a 6-char random suffix.

Body: `{ email, password, display_name }`. `201 Created` returns `{ token, user: { id, email, display_name, level, xp, coins } }`. `400 VALIDATION_FAILED`, `409 EMAIL_TAKEN`.

### POST `/login` (public)

Body: `{ email, password }`. `200 OK` with the same shape as `/register`. `401 INVALID_CREDENTIALS` is returned for any auth failure to prevent enumeration.

### POST `/google` (public)

Body: `{ credential }` where `credential` is the Google ID token. `200 OK` with the same shape. `401 INVALID_GOOGLE_TOKEN`, `409 EMAIL_TAKEN`, `500 SERVER_MISCONFIGURED`.

### POST `/logout` (auth)

`204 No Content`. Stateless; the client discards its token.

### GET `/me` (auth)

Returns `{ id, email, display_name, username, level, xp, coins, streak_current, streak_longest, avatar_url, visibility }`.

## Habits (`/api/habits`, all auth)

`days_of_week` is an array of weekday integers, Sunday = 0 through Saturday = 6. Time fields use `HH:MM` or `HH:MM:SS`. Dates are `YYYY-MM-DD` in UTC.

### GET `/` (auth)

Lists today's active habits with per-habit `completed_today` and `current_streak`.

### POST `/` (auth)

Body: `{ name, description?, category, frequency, days_of_week?, completion_start_time?, completion_end_time? }`. Weekly habits require non-empty `days_of_week`. `201 Created` returns the habit row.

### POST `/reorder` (auth)

Body: top-level array of `{ id, sort_order }`. `204` on success, `404 NOT_FOUND` if any id is not owned.

### PUT `/:id` (auth)

Partial update; only provided fields are written. `200 OK` returns the updated row.

### DELETE `/:id` (auth)

Soft delete (`is_active = false`). `204`.

### POST `/:id/complete` (auth)

Single transaction wrapping streak recompute, completion insert with final xp/coins, item drop, level recompute, user/pet updates, and a best-effort socket fanout to friends. Emits `level_up` to the actor when they cross a level threshold. `200 OK` returns `{ xp_earned, coins_earned, new_streak, longest_streak, item_dropped, leveled_up, new_level, pet_health, pet_total_habits_completed, pet_is_fainted }`. `409 ALREADY_COMPLETED` if the habit was already marked complete today.

### GET `/:id/history` (auth)

Last 30 completions, newest first.

## Pet (`/api/pet`, all auth)

### GET `/` (auth)

Full pet row with `equipped` keyed by slot.

### POST `/feed` (auth)

Body: `{ item_id }`. Transactional apply-consumable; bumps the stat named by the item's `effect_stat` (whitelisted to `health`/`happiness`/`hunger`/`energy`/`cleanliness`) capped at 100, decrements inventory. Returns the updated pet row.

### POST `/equip` (auth)

Body: `{ item_id }`. UPSERTs equipped_cosmetics on `(user_id, slot)`; inventory is not consumed.

### POST `/unequip` (auth)

Body: `{ slot }`. `204`.

## Shop (`/api/shop`, all auth)

### GET `/` (auth)

Items grouped by type. Cosmetics carry `owned`. Includes the caller's coin balance.

### POST `/purchase` (auth)

Body: `{ item_id }`. Transactional. `402 INSUFFICIENT_COINS`, `404 ITEM_NOT_FOUND`.

### POST `/buy-streak-freeze` (auth)

Deducts 50 coins, increments `streaks.freeze_count` (cap 3). No inventory row is added; the counter is the protection mechanism. `402 INSUFFICIENT_COINS`, `409 FREEZE_LIMIT_REACHED`.

## Inventory (`/api/inventory`, all auth)

### GET `/` (auth)

`{ consumables, cosmetics, streak_freezes }`. Cosmetics carry `equipped_slot` (string or null).

## Social (`/api/social`, all auth)

### GET `/friends` (auth)

Returns the caller's accepted friends.

```json
{
  "friends": [
    {
      "id": "<uuid>",
      "display_name": "Iris",
      "username": "iris",
      "avatar_url": null,
      "level": 4,
      "streak_current": 7
    }
  ]
}
```

`streak_current` is `null` when the friend's visibility is `private`. All other fields are visible regardless.

### POST `/friends/request` (auth)

Body: `{ username }`. Validates not-self, not-already-friends, no inbound or outbound pending request. UPSERTs on `(from_user_id, to_user_id)` so a previously rejected request can be re-issued. Emits `friend_request` to the recipient.

`201 Created`:

```json
{
  "id": "<uuid>",
  "from_user_id": "<uuid>",
  "from_username": "you",
  "from_display_name": "You",
  "from_avatar_url": null,
  "status": "pending",
  "created_at": "<timestamptz>"
}
```

Errors:

- `404 USER_NOT_FOUND`
- `400 INVALID_TARGET` — self-request.
- `409 ALREADY_FRIENDS`
- `409 REQUEST_PENDING` — outbound pending.
- `409 REQUEST_PENDING_INBOUND` — the other party already sent you one.

### GET `/friends/requests` (auth)

Pending incoming requests with sender details.

### PUT `/friends/request/:id` (auth)

Body: `{ action: "accept" | "reject" }`. Validates the request's `to_user_id` matches the caller. On accept: status `accepted` and both directional rows inserted into `friends`. On reject: status `rejected`. Emits `friend_request_responded` to the original sender.

`200 OK`: `{ id, status }`. `404 NOT_FOUND`, `409 ALREADY_RESPONDED`.

### DELETE `/friends/:friend_id` (auth)

Removes both directional edges. `204`.

### POST `/gifts/send` (auth)

Body: `{ friend_id, item_id, message? }`. Transactional: cooldown check (1 per friend per day), inventory decrement, `gifts` insert, `notifications` insert for the recipient, `activity_events` insert for the sender. Emits `gift_received` to the recipient. Consumables only.

`201 Created`:

```json
{
  "gift": {
    "id": "<uuid>",
    "from_user_id": "<uuid>",
    "to_user_id": "<uuid>",
    "item_id": "<uuid>",
    "message": "for the rough week",
    "is_accepted": false,
    "sent_at": "<timestamptz>"
  },
  "item": { "id": "<uuid>", "name": "Apple", "image_url": "/items/apple.svg" }
}
```

Errors:

- `404 NOT_FRIENDS`
- `404 NOT_IN_INVENTORY`
- `400 NOT_GIFTABLE` — item is not a consumable.
- `429 GIFT_COOLDOWN` — caller already sent this friend a gift today.

### POST `/gifts/:id/accept` (auth)

UPSERTs the gifted item into the recipient's inventory and flips `is_accepted`. Returns the updated gift row plus the recipient's full inventory listing.

`200 OK`: `{ gift, inventory: { consumables, cosmetics, streak_freezes } }`. `404 NOT_FOUND`, `409 ALREADY_ACCEPTED`.

### GET `/activity` (auth)

Last 20 activity events for the caller and their friends.

```json
{
  "activity": [
    {
      "user_id": "<uuid>",
      "user_display_name": "Iris",
      "type": "gift_sent",
      "metadata": { "to_user_id": "<uuid>", "item_id": "<uuid>", "item_name": "Apple" },
      "created_at": "<timestamptz>"
    }
  ]
}
```

Today only `gift_sent` is written. Habit completions, purchases, friendships, and level-ups will start emitting activity events in a follow-up prompt.

## Focus (`/api/focus`, all auth)

### POST `/complete` (auth)

Body: `{ duration_minutes, rating? }`. `duration_minutes` is 1..120; `rating` is 1..5 if provided. Flat reward of 10 coins. `201 Created` returns `{ session_id, coins_earned, total_focus_time }` where `total_focus_time` is the running total across all sessions.

Errors:

- `400 INVALID_DURATION`
- `400 INVALID_RATING`

### GET `/stats` (auth)

```json
{
  "total_sessions": 12,
  "total_minutes": 380,
  "average_rating": 4.25,
  "sessions_this_week": 3
}
```

`average_rating` is `null` when the user has no rated sessions.

## Leaderboard (`/api/leaderboard`, all auth)

### GET `/friends` (auth)

Caller plus accepted friends, sorted by `level DESC, xp DESC`, limit 50. Includes the caller so they can see their own rank inside their circle.

```json
{
  "entries": [
    {
      "rank": 1,
      "id": "<uuid>",
      "display_name": "Iris",
      "username": "iris",
      "avatar_url": null,
      "level": 5,
      "xp": 1240,
      "streak_current": 9
    }
  ]
}
```

### GET `/global` (auth)

Top 100 users by `level DESC, xp DESC`, filtered to `visibility = 'public'`. PRODUCT.md principle #3 ("private by default, social by invitation") makes this an opt-in surface: users must set their visibility to `public` to appear here.

## Notifications (`/api/notifications`, all auth)

### GET `/` (auth)

Unread notifications for the caller, newest first.

```json
{
  "notifications": [
    {
      "id": "<uuid>",
      "type": "gift_received",
      "content": "You received Apple as a gift",
      "metadata": {
        "gift_id": "<uuid>",
        "item_id": "<uuid>",
        "item_name": "Apple",
        "from_user_id": "<uuid>",
        "message": null
      },
      "is_read": false,
      "created_at": "<timestamptz>"
    }
  ]
}
```

Today, only the gift flow writes notifications. Friend-request acceptance and level-ups emit socket events but do not persist a notification row (deliberate; will revisit if offline-recovery matters).

### PUT `/read` (auth)

Marks every unread notification for the caller as read. `204 No Content`.

## User (`/api/user`, all auth)

| Method | Path        | Status | Description                                              |
| ------ | ----------- | ------ | -------------------------------------------------------- |
| GET    | `/profile`  | 501    | Caller's own profile.                                    |
| PATCH  | `/profile`  | 501    | Update display name, bio, avatar, visibility.            |
| GET    | `/:username`| 501    | Public profile lookup by username (respects visibility). |

(Notification endpoints previously stubbed under `/api/user/notifications/*` have moved to the top-level `/api/notifications` router.)

## WebSocket

Mounted at the same origin via socket.io. The handshake middleware verifies a JWT supplied via one of: `socket.handshake.auth.token`, the `token` query parameter, or an `Authorization: Bearer ...` header. Unauthenticated handshakes are rejected with `UNAUTHORIZED`. Authenticated sockets join a room named `user:<id>`.

### Client to server

| Event | Payload | Description           |
| ----- | ------- | --------------------- |
| _none yet_ |     |                       |

### Server to client

| Event                        | Recipient                | Payload                                                                                   | Description                                                          |
| ---------------------------- | ------------------------ | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `habit_completed`            | Each friend of the actor | `{ user_id, habit_id, habit_name, new_streak, leveled_up }`                              | Emitted when a friend completes a habit.                              |
| `level_up`                   | The actor                | `{ new_level }`                                                                           | Emitted to the user themselves when a completion crosses a level.    |
| `friend_request`             | The recipient            | `{ request_id, from_user_id, from_username, from_display_name, from_avatar_url }`        | Emitted on `POST /api/social/friends/request`.                       |
| `friend_request_responded`   | The original sender      | `{ request_id, status, responder_id, responder_username, responder_display_name }`       | Emitted on `PUT /api/social/friends/request/:id`.                    |
| `gift_received`              | The recipient            | `{ gift_id, from_user_id, from_username, from_display_name, item_id, item_name, item_image_url, message }` | Emitted on `POST /api/social/gifts/send`.            |

All server emits are best-effort: if delivery fails, the underlying database transaction is not rolled back.

## Cron jobs

`cronService.startCronJobs` registers a daily rollover at `0 0 * * *` UTC. For each user whose last completion is before today:

- gap == 1 day: streak stays intact.
- gap > 1 day with `freeze_count > 0`: consume one freeze, streak holds.
- gap > 1 day with `freeze_count == 0`: streak resets to 0.

After streak resolution, pet health is set to `MIN(current_streak * 5, 100)` (cron uses the literal formula; the in-app completion path ratchets up). When the resulting health is 0, `is_fainted` is set to true. Each user is processed in its own transaction; a single failure does not abort the sweep.
