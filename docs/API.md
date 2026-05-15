# API Reference

HTTP and WebSocket contract for the current Kyndill backend. All route groups listed here are implemented: auth, habits, pet, shop, inventory, social, focus, leaderboard, notifications, user profile, feedback, progress, and recovery.

## Base URL

- Local: `http://localhost:3000`
- Production: planned Google Cloud API origin; set in the frontend with `VITE_API_URL`.

## Conventions

- All requests and responses are JSON.
- Timestamps are ISO 8601 in UTC; dates are `YYYY-MM-DD`.
- IDs are UUID strings.
- Authentication uses JWT bearer tokens: `Authorization: Bearer <token>`.
- Tokens are signed with HS256 and expire after 7 days.
- Validation errors return `400 VALIDATION_FAILED` and include an `issues` array.
- Standard error shape:

```json
{ "error": { "code": "STRING_CODE", "message": "Human readable" } }
```

## Authentication Scope

Public endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`

Every other `/api/*` endpoint requires a valid bearer token. Missing or expired tokens return `401 UNAUTHORIZED`.

## Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | no | Liveness probe. Returns `{ "status": "ok" }`. |

## Auth (`/api/auth`)

### POST `/register`

Creates an email/password account. The username is generated from the email local part; collisions append a random suffix. New users start with 20 coins and two streak freezes.

Body:

```json
{
  "email": "iris@example.com",
  "password": "StrongPass1!",
  "password_confirmation": "StrongPass1!",
  "display_name": "Iris"
}
```

Password requirements: 10 to 72 characters, at least one lowercase letter, one uppercase letter, one number, and one symbol.

Returns `201 Created`:

```json
{
  "token": "<jwt>",
  "user": {
    "id": "<uuid>",
    "email": "iris@example.com",
    "display_name": "Iris",
    "level": 1,
    "xp": 0,
    "coins": 20
  }
}
```

Errors: `400 VALIDATION_FAILED`, `409 EMAIL_TAKEN`.

### POST `/login`

Body: `{ "email": "iris@example.com", "password": "StrongPass1!" }`.

Returns `200 OK` with `{ token, user }`. Invalid credentials return `401 INVALID_CREDENTIALS`.

### POST `/google`

Body: `{ "credential": "<google-id-token>" }`.

The backend verifies the token against `GOOGLE_CLIENT_ID`. If a local account already exists with the same verified email, Google sign-in links that account to the Google subject id.

Returns `200 OK` with `{ token, user }`.

Errors: `401 INVALID_GOOGLE_TOKEN`, `409 EMAIL_TAKEN`, `500 SERVER_MISCONFIGURED`.

### POST `/logout`

Auth required. Returns `204 No Content`. JWT auth is stateless; the client discards its token.

### GET `/me`

Auth required. Returns the current auth user:

```json
{
  "id": "<uuid>",
  "email": "iris@example.com",
  "display_name": "Iris",
  "username": "iris",
  "level": 3,
  "xp": 240,
  "coins": 64,
  "streak_current": 5,
  "streak_longest": 9,
  "avatar_url": null,
  "visibility": "friends"
}
```

## Habits (`/api/habits`)

`days_of_week` uses Sunday = 0 through Saturday = 6. Time fields are `HH:MM` or `HH:MM:SS`.

### GET `/`

Query:

- `scope=today` or omitted: active habits expected today
- `scope=all`: all habits for the Habits page

Returns `{ "habits": [...] }`.

### POST `/`

Creates a habit.

Body:

```json
{
  "name": "Drink water",
  "description": "A few check-ins through the day",
  "category": "Health",
  "frequency": "daily",
  "target_count": 4,
  "days_of_week": [1, 2, 3, 4, 5],
  "completion_start_time": "08:00",
  "completion_end_time": "22:00"
}
```

Rules:

- `category`: `Health`, `Productivity`, `Social`, `Learning`, or `Wellness`
- `frequency`: `daily` or `weekly`
- weekly habits require at least one `days_of_week` value
- `target_count`: `1..24`; values above 1 make the habit repeat within the day

Returns `201 Created` with the habit row.

### POST `/reorder`

Body is a top-level array:

```json
[
  { "id": "<uuid>", "sort_order": 0 },
  { "id": "<uuid>", "sort_order": 1 }
]
```

Returns `204 No Content`.

### PUT `/:id`

Partial update for habit fields, including `is_active` and `sort_order`. Returns the updated habit row.

### DELETE `/:id`

Archives the habit by setting `is_active = false`. Returns `204 No Content`.

### POST `/:id/complete`

Completes or increments today's progress for a habit.

The service runs a transaction that locks the habit, completion row, and streak row. If the habit has `target_count > 1`, intermediate check-ins update `completion_count` but do not award XP/coins until the target is reached.

Final completion updates:

- `habit_completions`
- `streaks`
- mirrored streak fields on `users`
- `users.xp`, `users.level`, `users.coins`
- pet stats and derived health
- possible item drop and inventory
- notifications and activity events
- socket events for the actor and friends

Returns:

```json
{
  "xp_earned": 18,
  "coins_earned": 12,
  "new_streak": 5,
  "longest_streak": 9,
  "item_dropped": null,
  "leveled_up": false,
  "new_level": 3,
  "pet_health": 76,
  "pet_happiness": 88,
  "pet_hunger": 72,
  "pet_energy": 80,
  "pet_cleanliness": 91,
  "pet_total_habits_completed": 42,
  "pet_is_fainted": false,
  "completed_count": 4,
  "target_count": 4,
  "completed_today": true
}
```

Errors: `404 NOT_FOUND`, `409 ALREADY_COMPLETED`, `409 PROGRESS_CONFLICT`.

### GET `/:id/history`

Returns `{ "completions": [...] }` for the last 30 completion days.

## Pet (`/api/pet`)

### GET `/`

Returns the full pet row plus equipped cosmetics keyed by slot. Reading pet state applies passive daily stat decay and recalculates health.

### POST `/initialize`

Sets pet species/name and marks onboarding complete.

Body:

```json
{ "species": "star", "name": "Kyndill" }
```

`species` is `star`, `cube`, `sphere`, or `pyramid`. Name must be 1..20 characters.

Returns the updated pet. Subsequent calls return `409 ALREADY_INITIALIZED`.

### PATCH `/name`

Renames the pet.

Body: `{ "name": "Nova" }`.

Returns the updated pet.

### POST `/feed`

Body: `{ "item_id": "<uuid>" }`.

Consumes a consumable item from inventory and applies its effect to one pet stat. Returns the updated pet.

### POST `/equip`

Body: `{ "item_id": "<uuid>" }`.

Equips an owned cosmetic in its slot. Valid slots are `hat`, `accessory`, `glasses`, `scarf`, `badge`, and `charm`. Returns `{ "equipped": ... }`.

### POST `/unequip`

Body: `{ "slot": "hat" }`.

Returns `204 No Content`.

## Shop (`/api/shop`)

### GET `/`

Returns the caller's coin balance, streak-freeze count, and shop items grouped by type.

```json
{
  "coins": 64,
  "freeze_count": 2,
  "items": {
    "consumable": [],
    "cosmetic": [],
    "streak_freeze": []
  }
}
```

Cosmetics include `owned`. Only sprite-backed cosmetics are returned.

### POST `/purchase`

Body: `{ "item_id": "<uuid>" }`.

Deducts coins, adds the item to inventory, and records a purchase activity event.

Returns `{ "new_coin_balance": 29, "item": { ... } }`.

Errors: `402 INSUFFICIENT_COINS`, `404 ITEM_NOT_FOUND`, `404 ITEM_NOT_AVAILABLE`, `409 ALREADY_OWNED`.

### POST `/buy-streak-freeze`

Buys one streak freeze for 35 coins. The counter is stored in `streaks.freeze_count` and is capped at 3.

Returns `{ "new_freeze_count": 3, "new_coin_balance": 29 }`.

Errors: `402 INSUFFICIENT_COINS`, `409 FREEZE_LIMIT_REACHED`.

## Inventory (`/api/inventory`)

### GET `/`

Returns:

```json
{
  "consumables": [],
  "cosmetics": [],
  "streak_freezes": []
}
```

Inventory entries include item metadata, `quantity`, and `equipped_slot`.

## Social (`/api/social`)

### GET `/friends`

Returns accepted friends. `level` is public; `streak_current` is `null` when the friend's visibility is private.

### POST `/friends/request`

Body: `{ "username": "iris" }`.

Validates not-self, not already friends, and no pending request in either direction. Inserts or reissues a pending request and notifies the recipient.

Returns `201 Created` with the friend request.

### GET `/friends/requests`

Returns pending incoming requests.

### GET `/friends/requests/sent`

Returns pending outgoing requests.

### PUT `/friends/request/:id`

Body: `{ "action": "accept" }` or `{ "action": "reject" }`.

Accepting inserts both directed `friends` rows and records a friendship activity event. Returns `{ "id": "<uuid>", "status": "accepted" }`.

### DELETE `/friends/:friend_id`

Deletes both directed friendship edges. Returns `204 No Content`.

### POST `/gifts/send`

Body:

```json
{
  "friend_id": "<uuid>",
  "item_id": "<uuid>",
  "message": "For today"
}
```

Only consumables can be gifted. The sender can send one gift per friend per day.

Returns `201 Created` with `{ gift, item }`.

### POST `/gifts/:id/accept`

Adds the gifted item to the recipient inventory and marks the gift accepted.

Returns `{ "gift": { ... }, "inventory": { ... } }`.

### GET `/activity`

Returns the last 30 activity events for the caller and accepted friends. Habit names are redacted from friend-visible habit completion metadata.

Activity types currently include `habit_completed`, `purchase`, `friendship`, `level_up`, and `gift_sent`.

## Focus (`/api/focus`)

### POST `/complete`

Body: `{ "duration_minutes": 25, "rating": 4 }`.

`duration_minutes` is `1..120`. `rating` is optional and must be `1..5`. Coins scale with session length from 4 to 36.

Returns `201 Created`:

```json
{
  "session_id": "<uuid>",
  "coins_earned": 8,
  "total_focus_time": 180
}
```

### GET `/stats`

Returns total sessions, total minutes, average rating, and sessions in the last 7 days.

### PATCH `/:id/rating`

Body: `{ "rating": 5 }`.

Updates the rating for one owned focus session. Returns `204 No Content`.

## Leaderboard (`/api/leaderboard`)

### GET `/friends`

Returns the caller plus accepted friends, sorted by `level DESC, xp DESC`, limit 50.

### GET `/global`

Returns the top 100 users with `visibility = 'public'`, sorted by `level DESC, xp DESC`.

## Notifications (`/api/notifications`)

### GET `/`

Returns unread notifications newest first. Notification preferences stored in `users.notification_prefs` are applied when listing friend-request and gift notifications.

Notification types currently written include friend requests, friend request responses, gifts, item drops, and level-ups.

### PUT `/read`

Marks all unread notifications for the caller as read. Returns `204 No Content`.

### GET `/push/public-key`

Returns browser Web Push configuration for the current backend:

```json
{ "enabled": true, "public_key": "<VAPID public key>" }
```

If VAPID keys are missing, `enabled` is `false` and `public_key` is `null`.

### GET `/push/status`

Returns whether push is configured and how many push subscriptions the current user has stored.

### POST `/push/subscribe`

Body is the browser `PushSubscription` JSON:

```json
{
  "endpoint": "https://push.example/subscription",
  "expirationTime": null,
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

Stores or updates this browser subscription for the authenticated user. Returns `{ "ok": true }`.

### POST `/push/unsubscribe`

Body: `{ "endpoint": "https://push.example/subscription" }`.

Removes this browser subscription. Returns `204 No Content`.

### POST `/push/test`

Sends a test browser push notification to the current user’s stored subscriptions. Returns `202 Accepted`.

Push delivery is suppressed while the user has an active Kyndill web session connected over Socket.IO, so the in-app notification bell/toast handles visible-session updates without duplicate browser pushes.

## User (`/api/user`)

### GET `/search?q=...`

Searches users by username prefix. Requires at least 2 characters. Returns `{ "users": [...] }`.

### GET `/profile`

Returns the caller's full profile, including profile fields, stats, auth provider, notification preferences, and research consent.

### PATCH `/profile`

Partial profile update.

Allowed fields:

- `display_name`
- `username`
- `bio`
- `visibility`
- `avatar_url` as an image data URL or URL
- `notification_prefs`
- `research_consent`

Returns the updated profile.

### POST `/change-password`

Email/password accounts only.

Body:

```json
{
  "current_password": "OldPass1!",
  "new_password": "NewStrongPass1!"
}
```

New password uses the same strength rules as registration and cannot equal the current password.

Returns `204 No Content`.

### DELETE `/account`

Body: `{ "confirmation": "DELETE" }`.

Deletes the user row; user-owned records are removed through cascading foreign keys. Returns `204 No Content`.

### GET `/friends/:id/profile`

Returns a friend's profile plus pet summary. The friend's level is public. Streak and total habit history are included only when visibility allows it.

### GET `/:username`

Looks up a user by exact username using the search endpoint's result shape.

## Feedback (`/api/feedback`)

### POST `/`

Stores explicit feedback or habit-completion mood feedback.

Body:

```json
{
  "habit_id": "<uuid>",
  "context": "habit_completion",
  "mood": "calm",
  "rating": 4,
  "note": "This felt doable today."
}
```

`habit_id`, `mood`, `rating`, and `note` are optional. Returns `201 Created` with `{ "ok": true }`.

## Progress (`/api/progress`)

### GET `/summary`

Returns generated behavioral metrics for the Progress page:

- total habits created and active habits
- total check-ins and completed habit-days
- active days
- current and longest streak
- focus minutes and sessions
- friends, gifts sent, gifts received
- feedback and recovery reflection counts
- 7-day completion summary
- most consistent habit over the last 30 days
- category breakdown

## Recovery (`/api/recovery`)

### GET `/prompt`

Returns `{ "prompt": null }` or a gentle missed-habit recovery prompt with `missed_on` and up to four missed habits.

### POST `/reflection`

Body:

```json
{
  "missed_on": "2026-05-12",
  "habit_id": "<uuid>",
  "mood": "tired",
  "note": "Schedule was too tight.",
  "skipped": false
}
```

Stores a recovery reflection in `feedback_events`. Returns `201 Created` with `{ "ok": true }`.

## WebSocket

socket.io is mounted on the same backend server. The handshake accepts a JWT from:

- `socket.handshake.auth.token`
- `token` query parameter
- `Authorization: Bearer <token>` header

Authenticated sockets join `user:<id>`.

### Server To Client Events

| Event | Recipient | Payload summary |
| --- | --- | --- |
| `habit_completed` | Friends of actor | `user_id`, `habit_id`, `habit_name`, `new_streak`, `leveled_up` |
| `level_up` | Actor | `new_level` |
| `item_dropped` | Actor | `item_id`, `item_name`, `rarity` |
| `friend_request` | Recipient | request id and sender profile fields |
| `friend_request_responded` | Original sender | request id, status, responder profile fields |
| `gift_received` | Recipient | gift id, sender fields, item fields, optional message |
| `activity_updated` | Actor and friends | `actor_user_id` |

All server emits are best effort. Socket delivery failure does not roll back the database transaction.

## Cron Jobs

`cronService.startCronJobs` registers a daily rollover at `0 0 * * *` UTC.

For users whose last completion date is before today:

- gap of 1 day: streak remains intact
- gap greater than 1 day with freezes available: one freeze is consumed and streak is preserved
- gap greater than 1 day without freezes: streak resets to 0

The cron job recalculates pet health with the same `derivePetHealth` model used by pet reads: streak momentum plus happiness, hunger, energy, and cleanliness. Each user is processed in its own transaction so one failure does not abort the entire sweep.
