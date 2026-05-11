# API reference

HTTP and WebSocket contract for the Kyndill backend. Routes marked `501` are still stubs; auth, habits, pet, shop, and inventory are fully implemented.

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

Body:

```json
{
  "email": "user@example.com",
  "password": "minimum-8-chars",
  "display_name": "Display Name"
}
```

`201 Created`:

```json
{
  "token": "<JWT>",
  "user": {
    "id": "<uuid>",
    "email": "user@example.com",
    "display_name": "Display Name",
    "level": 1,
    "xp": 0,
    "coins": 0
  }
}
```

Errors:

- `400 VALIDATION_FAILED` — invalid email, password under 8 characters, or display_name under 2 characters.
- `409 EMAIL_TAKEN` — email already registered.

### POST `/login` (public)

Body:

```json
{
  "email": "user@example.com",
  "password": "the-password"
}
```

`200 OK` returns the same shape as `/register`.

Errors:

- `400 VALIDATION_FAILED`
- `401 INVALID_CREDENTIALS` — unknown email, wrong password, or OAuth-only account (combined to prevent account enumeration).

### POST `/google` (public)

Exchange a Google ID token for a Kyndill JWT. Creates an account on first sign-in; subsequent sign-ins return the existing user.

Body:

```json
{
  "credential": "<Google ID token from Google Identity Services>"
}
```

`200 OK` returns the same shape as `/register`.

Errors:

- `400 VALIDATION_FAILED`
- `401 INVALID_GOOGLE_TOKEN` — token did not verify against `GOOGLE_CLIENT_ID`, or required claims (`email`, `sub`) were missing.
- `409 EMAIL_TAKEN` — a local-credentials account already uses the email Google returned. Linking is not yet supported; sign in with the password instead.
- `500 SERVER_MISCONFIGURED` — `GOOGLE_CLIENT_ID` is unset on the server.

### POST `/logout` (auth)

Returns `204 No Content`. The server is stateless; the client discards its token. Endpoint exists for client-side symmetry.

### GET `/me` (auth)

Returns the authenticated user's profile.

`200 OK`:

```json
{
  "id": "<uuid>",
  "email": "user@example.com",
  "display_name": "Display Name",
  "username": "user",
  "level": 1,
  "xp": 0,
  "coins": 0,
  "streak_current": 0,
  "streak_longest": 0,
  "avatar_url": null,
  "visibility": "private"
}
```

Errors:

- `401 UNAUTHORIZED` — missing, malformed, or expired token.

## Habits (`/api/habits`, all auth)

`days_of_week` is an array of weekday integers, Sunday = 0 through Saturday = 6. Time fields use `HH:MM` or `HH:MM:SS`. Dates are `YYYY-MM-DD` and currently interpreted in UTC; per-user time zones will land in a later prompt.

### GET `/` (auth)

Lists today's active habits for the caller. Weekly habits are included only when today's weekday is in `days_of_week`. Each habit carries `completed_today` and `current_streak` (per-habit, computed from completions on expected days).

`200 OK`:

```json
{
  "habits": [
    {
      "id": "<uuid>",
      "user_id": "<uuid>",
      "name": "Drink water",
      "description": null,
      "category": "Health",
      "frequency": "daily",
      "days_of_week": null,
      "completion_start_time": null,
      "completion_end_time": null,
      "is_active": true,
      "sort_order": 0,
      "created_at": "<timestamptz>",
      "completed_today": false,
      "current_streak": 3
    }
  ]
}
```

### POST `/` (auth)

Body:

```json
{
  "name": "Morning walk",
  "description": "Twenty minutes outside",
  "category": "Wellness",
  "frequency": "weekly",
  "days_of_week": [1, 3, 5],
  "completion_start_time": "06:00",
  "completion_end_time": "10:00"
}
```

Required: `name` (1..100), `category` (`Health`/`Productivity`/`Social`/`Learning`/`Wellness`), `frequency` (`daily`/`weekly`). When `frequency = weekly`, `days_of_week` is required and non-empty.

`201 Created` returns the created habit row.

Errors:

- `400 VALIDATION_FAILED` — schema or invariant violation (e.g. weekly without `days_of_week`).

### POST `/reorder` (auth)

Bulk update of `sort_order`. Body is a top-level array.

```json
[
  { "id": "<uuid>", "sort_order": 0 },
  { "id": "<uuid>", "sort_order": 1 }
]
```

`204 No Content` on success.

Errors:

- `400 VALIDATION_FAILED`
- `404 NOT_FOUND` — one or more habit ids are not owned by the caller.

### PUT `/:id` (auth)

Updates one or more fields on the habit. All body fields are optional; only provided fields are written.

Allowed fields: `name`, `description`, `category`, `frequency`, `days_of_week`, `completion_start_time`, `completion_end_time`, `is_active`, `sort_order`.

`200 OK` returns the updated habit row.

Errors:

- `400 VALIDATION_FAILED`
- `404 NOT_FOUND` — habit does not exist or is not owned by the caller.

### DELETE `/:id` (auth)

Soft delete: sets `is_active = false`. Habit data and historical completions are preserved.

`204 No Content` on success.

Errors:

- `404 NOT_FOUND`

### POST `/:id/complete` (auth)

Marks the habit complete for today as a single database transaction:

1. Validate ownership.
2. Reject `409 ALREADY_COMPLETED` if a completion already exists for `(habit_id, today)`.
3. Inside a transaction: lock the user's streak row, recompute streak (yesterday → +1; gap with `freeze_count > 0` → consume freeze, streak holds; otherwise reset to 1), insert the completion with the final xp/coin values, roll an item drop, recompute level, update users + pet, commit.
4. Best-effort emit `habit_completed` over socket.io to every friend.

`200 OK`:

```json
{
  "xp_earned": 12,
  "coins_earned": 5,
  "new_streak": 1,
  "longest_streak": 1,
  "item_dropped": {
    "id": "<uuid>",
    "name": "Apple",
    "type": "consumable",
    "rarity": "common",
    "effect_stat": "hunger",
    "effect_amount": 15,
    "image_url": "/items/apple.svg",
    "category": null
  },
  "leveled_up": false,
  "new_level": 1,
  "pet_health": 100,
  "pet_total_habits_completed": 1,
  "pet_is_fainted": false
}
```

`item_dropped` is `null` when the rarity roll lands in the "none" band.

Errors:

- `404 NOT_FOUND`
- `409 ALREADY_COMPLETED` — habit was already marked complete today.

### GET `/:id/history` (auth)

Returns the last 30 completions for the habit, newest first.

`200 OK`:

```json
{
  "completions": [
    {
      "id": "<uuid>",
      "completed_on": "2026-05-10",
      "completed_at": "2026-05-10T19:42:11.000Z",
      "xp_earned": 12,
      "coins_earned": 5
    }
  ]
}
```

Errors:

- `404 NOT_FOUND`

## Pet (`/api/pet`, all auth)

### GET `/` (auth)

Returns the caller's pet, all five stats, stage, `total_habits_completed`, `is_fainted`, and currently equipped cosmetics keyed by slot.

`200 OK`:

```json
{
  "id": "<uuid>",
  "user_id": "<uuid>",
  "species": "blob",
  "name": "Kyndill",
  "health": 100,
  "happiness": 100,
  "hunger": 80,
  "energy": 90,
  "cleanliness": 100,
  "stage": 1,
  "total_habits_completed": 3,
  "is_fainted": false,
  "created_at": "<timestamptz>",
  "equipped": {
    "hat": {
      "id": "<uuid>",
      "name": "Beanie Hat",
      "rarity": "common",
      "image_url": "/items/beanie-hat.svg"
    }
  }
}
```

Errors:

- `404 PET_NOT_FOUND`

### POST `/feed` (auth)

Apply a consumable from inventory to the pet. Inside a transaction with `FOR UPDATE` on the inventory row: validates ownership and item type, applies `LEAST(stat + effect_amount, 100)` to the stat named by `effect_stat`, and decrements quantity (or deletes the row when quantity reaches zero).

Body:

```json
{ "item_id": "<uuid>" }
```

`200 OK` returns the full pet row (without equipped cosmetics).

Errors:

- `400 NOT_CONSUMABLE` — item is not a consumable.
- `400 INVALID_ITEM` — consumable's `effect_stat` is not a pet stat or `effect_amount` is null.
- `404 NOT_IN_INVENTORY` — the caller has no copies of this item.

### POST `/equip` (auth)

Equip a cosmetic to its slot. The slot is read from the item's `category` (`hat` / `accessory` / `background`). UPSERT on `(user_id, slot)` so an existing equip in that slot is replaced. The inventory item is **not** consumed; the user can unequip and re-equip freely.

Body:

```json
{ "item_id": "<uuid>" }
```

`200 OK`:

```json
{
  "equipped": {
    "hat": {
      "id": "<uuid>",
      "name": "Beanie Hat",
      "rarity": "common",
      "image_url": "/items/beanie-hat.svg"
    }
  }
}
```

Errors:

- `400 NOT_COSMETIC`
- `400 INVALID_SLOT` — the cosmetic does not specify a valid `hat`/`accessory`/`background` category.
- `404 NOT_IN_INVENTORY`

### POST `/unequip` (auth)

Body:

```json
{ "slot": "hat" }
```

`204 No Content` on success. Idempotent: unequipping an empty slot succeeds silently.

Errors:

- `400 VALIDATION_FAILED` — `slot` not in (`hat`, `accessory`, `background`).

## Shop (`/api/shop`, all auth)

### GET `/` (auth)

Lists every catalogue item grouped by type, with an `owned` flag on cosmetics and the caller's current coin balance.

`200 OK`:

```json
{
  "coins": 130,
  "items": {
    "consumable": [
      {
        "id": "<uuid>",
        "name": "Apple",
        "type": "consumable",
        "rarity": "common",
        "price": 10,
        "effect_stat": "hunger",
        "effect_amount": 15,
        "image_url": "/items/apple.svg",
        "category": null
      }
    ],
    "cosmetic": [
      {
        "id": "<uuid>",
        "name": "Beanie Hat",
        "type": "cosmetic",
        "rarity": "common",
        "price": 50,
        "effect_stat": null,
        "effect_amount": null,
        "image_url": "/items/beanie-hat.svg",
        "category": "hat",
        "owned": true
      }
    ],
    "streak_freeze": [
      {
        "id": "<uuid>",
        "name": "Spark Shield",
        "type": "streak_freeze",
        "rarity": "common",
        "price": 50,
        "effect_stat": "streak_freeze_days",
        "effect_amount": 1,
        "image_url": "/items/spark-shield.svg",
        "category": null
      }
    ]
  }
}
```

### POST `/purchase` (auth)

Body:

```json
{ "item_id": "<uuid>" }
```

Inside a transaction with `FOR UPDATE` on the user row: validates the item exists, checks the balance, deducts coins, and UPSERTs the item into inventory (`quantity + 1`).

`200 OK`:

```json
{
  "new_coin_balance": 80,
  "item": { "id": "<uuid>", "name": "Apple", "type": "consumable", "...": "..." }
}
```

Errors:

- `402 INSUFFICIENT_COINS`
- `404 ITEM_NOT_FOUND`

### POST `/buy-streak-freeze` (auth)

Special purchase: 50 coins, increments `streaks.freeze_count` by 1 (max 3). No body. No inventory row is added; the freeze counter is the in-database mechanism that protects streaks. Catalogue rows for Spark/Ember/Hearth Shield remain purchasable via `/purchase` but have no automatic effect on `freeze_count` (kept available for a future "burn N days from the shield" flow).

`200 OK`:

```json
{ "new_freeze_count": 2, "new_coin_balance": 80 }
```

Errors:

- `402 INSUFFICIENT_COINS`
- `409 FREEZE_LIMIT_REACHED` — caller already has 3 freezes.

## Inventory (`/api/inventory`, all auth)

### GET `/` (auth)

Lists everything the caller owns, grouped by type. Cosmetics carry `equipped_slot` (string when currently equipped, `null` otherwise). `quantity` is meaningful for consumables; cosmetics and streak freezes typically have `quantity = 1`.

`200 OK`:

```json
{
  "consumables": [
    {
      "id": "<uuid>",
      "name": "Apple",
      "type": "consumable",
      "rarity": "common",
      "price": 10,
      "effect_stat": "hunger",
      "effect_amount": 15,
      "image_url": "/items/apple.svg",
      "category": null,
      "quantity": 3,
      "equipped_slot": null
    }
  ],
  "cosmetics": [
    {
      "id": "<uuid>",
      "name": "Beanie Hat",
      "type": "cosmetic",
      "rarity": "common",
      "price": 50,
      "effect_stat": null,
      "effect_amount": null,
      "image_url": "/items/beanie-hat.svg",
      "category": "hat",
      "quantity": 1,
      "equipped_slot": "hat"
    }
  ],
  "streak_freezes": []
}
```

## Social (`/api/social`, all auth)

| Method | Path                                | Status | Description                                            |
| ------ | ----------------------------------- | ------ | ------------------------------------------------------ |
| GET    | `/friends`                          | 501    | List the caller's friends.                             |
| DELETE | `/friends/:user_id`                 | 501    | Unfriend; removes both directional edges.              |
| GET    | `/friend-requests`                  | 501    | Incoming pending requests.                             |
| POST   | `/friend-requests`                  | 501    | Send a request by username.                            |
| POST   | `/friend-requests/:id/accept`       | 501    | Accept; creates the `friends` rows.                    |
| POST   | `/friend-requests/:id/reject`       | 501    | Reject; marks the request rejected.                    |
| GET    | `/gifts`                            | 501    | Gifts received by the caller.                          |
| POST   | `/gifts`                            | 501    | Send a gift (item from inventory) to a friend.         |
| POST   | `/gifts/:id/accept`                 | 501    | Accept; transfers the item into the caller's inventory.|
| POST   | `/gifts/:id/decline`                | 501    | Decline; the gift is dropped.                          |

## Focus (`/api/focus`, all auth)

| Method | Path         | Status | Description                                              |
| ------ | ------------ | ------ | -------------------------------------------------------- |
| POST   | `/sessions`  | 501    | Record a completed focus session (duration, optional rating). |
| GET    | `/sessions`  | 501    | Session history.                                         |
| GET    | `/stats`     | 501    | Aggregate stats (today / week / all-time minutes).       |

## User (`/api/user`, all auth)

| Method | Path                              | Status | Description                                                |
| ------ | --------------------------------- | ------ | ---------------------------------------------------------- |
| GET    | `/profile`                        | 501    | Caller's own profile.                                      |
| PATCH  | `/profile`                        | 501    | Update display name, bio, avatar, visibility.              |
| GET    | `/notifications`                  | 501    | List notifications (unread first).                         |
| PATCH  | `/notifications/:id/read`         | 501    | Mark one as read.                                          |
| POST   | `/notifications/read-all`         | 501    | Mark all unread as read.                                   |
| GET    | `/:username`                      | 501    | Public profile lookup by username (respects visibility).   |

## Leaderboard (`/api/leaderboard`, all auth)

| Method | Path        | Status | Description                                                       |
| ------ | ----------- | ------ | ----------------------------------------------------------------- |
| GET    | `/friends`  | 501    | Caller + friends, ranked by streak and weekly completions.        |
| GET    | `/weekly`   | 501    | Public users ranked by this week's completions (visibility-filtered). |

## WebSocket

Mounted at the same origin via socket.io. The handshake middleware verifies a JWT supplied via one of: `socket.handshake.auth.token`, the `token` query parameter, or an `Authorization: Bearer ...` header. Unauthenticated handshakes are rejected with `UNAUTHORIZED`. Authenticated sockets join a room named `user:<id>`.

### Client to server

| Event | Payload | Description           |
| ----- | ------- | --------------------- |
| _none yet_ |     |                       |

### Server to client

| Event             | Payload | Description                                                          |
| ----------------- | ------- | -------------------------------------------------------------------- |
| `habit_completed` | `{ user_id, habit_id, habit_name, new_streak, leveled_up }` | Emitted to each of the actor's friends when they complete a habit. Best-effort; failures don't roll back the completion. |
