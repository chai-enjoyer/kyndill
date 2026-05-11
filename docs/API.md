# API Reference

Base URL (production): `https://<vm-domain>/api`
Base URL (development): `http://localhost:3000/api`

All request and response bodies use `application/json`. Protected routes require an `Authorization: Bearer <token>` header. Tokens are signed HS256 JWTs with 7-day expiry, issued by the login and register endpoints.

**Status codes used throughout:**
- `200` — success (GET, PATCH, DELETE)
- `201` — created (POST creating a resource)
- `400` — validation error (Zod; body includes `issues[]`)
- `401` — missing or invalid token
- `403` — authenticated but not authorized for this resource
- `404` — resource not found
- `409` — conflict (duplicate email, username, re-send friend request, etc.)
- `501` — not yet implemented (all routes during foundation phase)

---

## Health

### GET /api/health

No authentication required.

**Response 200**
```json
{ "status": "ok", "timestamp": "2026-05-11T10:00:00.000Z" }
```

---

## Auth

### POST /api/auth/register `public`

Register a new account with email and password.

**Body**
```json
{
  "email": "user@example.com",
  "password": "minimum8chars",
  "username": "ember_user",
  "displayName": "Ember"
}
```

**Response 201**
```json
{
  "token": "<jwt>",
  "user": { "id": "...", "username": "...", "displayName": "..." }
}
```

---

### POST /api/auth/login `public`

**Body**
```json
{ "email": "user@example.com", "password": "..." }
```

**Response 200**
```json
{ "token": "<jwt>", "user": { "id": "...", "username": "...", "displayName": "..." } }
```

---

### POST /api/auth/google `public`

Exchange a Google ID token for a Kyndill JWT. Creates an account on first sign-in.

**Body**
```json
{ "idToken": "<google-id-token>" }
```

**Response 200**
```json
{ "token": "<jwt>", "user": { ... }, "isNew": true }
```

---

### GET /api/auth/me `protected`

Returns the authenticated user's full profile.

**Response 200**
```json
{
  "id": "uuid",
  "email": "...",
  "username": "...",
  "displayName": "...",
  "level": 4,
  "xp": 320,
  "coins": 150,
  "streakCurrent": 7,
  "streakLongest": 14,
  "visibility": "private"
}
```

---

### POST /api/auth/logout `protected`

Client-side token invalidation. Server records the logout event.

**Response 200**
```json
{ "message": "Logged out" }
```

---

## Habits

All routes require authentication.

### GET /api/habits

List all active habits, ordered by `sort_order`.

**Response 200**
```json
[
  {
    "id": "uuid",
    "name": "Morning run",
    "category": "Health",
    "frequency": "daily",
    "daysOfWeek": [1,2,3,4,5],
    "isActive": true,
    "sortOrder": 0,
    "completedToday": false,
    "createdAt": "..."
  }
]
```

---

### POST /api/habits

**Body**
```json
{
  "name": "Morning run",
  "category": "Health",
  "frequency": "daily",
  "daysOfWeek": [1,2,3,4,5],
  "description": "30 minutes outside"
}
```

**Response 201** — created habit object

---

### PATCH /api/habits/reorder

Bulk update sort order. Must be declared before `/:id`.

**Body**
```json
{ "order": [{ "id": "uuid", "sortOrder": 0 }, { "id": "uuid", "sortOrder": 1 }] }
```

**Response 200** `{ "message": "Reordered" }`

---

### GET /api/habits/:id

**Response 200** — single habit object

---

### PATCH /api/habits/:id

**Body** — partial habit fields (name, description, category, frequency, daysOfWeek, completionStartTime, completionEndTime, sortOrder)

**Response 200** — updated habit

---

### DELETE /api/habits/:id

Archives the habit (`is_active = false`). Completion history is preserved.

**Response 200** `{ "message": "Archived" }`

---

### POST /api/habits/:id/complete

Mark the habit completed for today. Idempotent (`ON CONFLICT DO NOTHING`).

**Body**
```json
{ "completedOn": "2026-05-11" }
```

**Response 200**
```json
{
  "completion": { "id": "...", "completedOn": "..." },
  "rewards": { "xpEarned": 10, "coinsEarned": 5, "leveledUp": false, "newLevel": 4 }
}
```

---

### DELETE /api/habits/:id/complete

Undo today's completion.

**Body**
```json
{ "completedOn": "2026-05-11" }
```

**Response 200** `{ "message": "Completion undone" }`

---

## Pet

All routes require authentication.

### GET /api/pet

**Response 200**
```json
{
  "id": "uuid",
  "name": "Ember",
  "species": "blob",
  "health": 84,
  "happiness": 91,
  "hunger": 70,
  "energy": 65,
  "cleanliness": 80,
  "stage": 1,
  "totalHabitsCompleted": 12,
  "isFainted": false
}
```

---

### PATCH /api/pet

**Body**
```json
{ "name": "Cinder", "species": "cube" }
```

**Response 200** — updated pet

---

### POST /api/pet/feed

Use a consumable item from inventory on the pet.

**Body**
```json
{ "itemId": "uuid" }
```

**Response 200**
```json
{
  "pet": { ... },
  "itemUsed": { "name": "Apple", "effectStat": "happiness", "effectAmount": 15 }
}
```

---

## Shop

All routes require authentication.

### GET /api/shop

List all purchasable items. Optional query: `?type=cosmetic|consumable|streak_freeze&rarity=common|rare|legendary`

**Response 200**
```json
[
  {
    "id": "uuid",
    "name": "Apple",
    "type": "consumable",
    "rarity": "common",
    "price": 10,
    "effectStat": "happiness",
    "effectAmount": 15,
    "category": "food"
  }
]
```

---

### POST /api/shop/buy

**Body**
```json
{ "itemId": "uuid" }
```

**Response 200**
```json
{ "item": { ... }, "remainingCoins": 140 }
```

**Errors:** `400` insufficient coins, `404` item not found

---

### GET /api/shop/inventory

**Response 200**
```json
[{ "item": { ... }, "quantity": 3 }]
```

---

### POST /api/shop/equip

**Body**
```json
{ "itemId": "uuid", "slot": "hat" }
```

**Response 200** `{ "message": "Equipped" }`

---

### DELETE /api/shop/equip/:slot

Slot: `hat` | `accessory` | `background`

**Response 200** `{ "message": "Unequipped" }`

---

## Social

All routes require authentication.

### GET /api/social/friends

**Response 200** — array of friend profiles (id, username, displayName, avatarUrl, streakCurrent)

---

### GET /api/social/friends/requests

List incoming pending friend requests.

**Response 200**
```json
[{ "id": "uuid", "from": { "id": "...", "username": "...", "displayName": "..." }, "createdAt": "..." }]
```

---

### POST /api/social/friends/requests

**Body**
```json
{ "toUserId": "uuid" }
```

**Response 201** — the new request

**Errors:** `409` already friends or request pending, `400` cannot add yourself

---

### PATCH /api/social/friends/requests/:id

**Body**
```json
{ "action": "accepted" }
```

`action`: `accepted` | `rejected`

**Response 200** `{ "message": "Request accepted" }`

---

### DELETE /api/social/friends/:friendId

**Response 200** `{ "message": "Friend removed" }`

---

### GET /api/social/gifts

List incoming pending gifts.

**Response 200**
```json
[{ "id": "uuid", "from": { ... }, "item": { ... }, "message": "...", "sentAt": "..." }]
```

---

### POST /api/social/gifts

**Body**
```json
{ "toUserId": "uuid", "itemId": "uuid", "message": "For you!" }
```

**Response 201** — the new gift

**Errors:** `400` insufficient quantity, `403` not friends with recipient

---

### PATCH /api/social/gifts/:id/accept

Transfers the item from sender to recipient's inventory.

**Response 200** `{ "message": "Gift accepted" }`

---

### PATCH /api/social/gifts/:id/decline

**Response 200** `{ "message": "Gift declined" }`

---

### GET /api/social/search?q=username

Search public users by username prefix.

**Response 200** — array of `{ id, username, displayName, avatarUrl }`

---

## Focus

All routes require authentication.

### GET /api/focus/sessions

**Query params:** `?limit=20`

**Response 200**
```json
[{ "id": "uuid", "durationMinutes": 25, "rating": 4, "completedAt": "..." }]
```

---

### POST /api/focus/sessions

**Body**
```json
{ "durationMinutes": 25, "rating": 4 }
```

**Response 201** — the recorded session

---

## User

All routes require authentication.

### GET /api/user/profile

Own full profile.

**Response 200** — full user object including level, xp, coins, streak, visibility

---

### PATCH /api/user/profile

**Body** — partial: `displayName`, `bio`, `avatarUrl`

**Response 200** — updated profile

---

### PATCH /api/user/password

**Body**
```json
{ "currentPassword": "...", "newPassword": "..." }
```

**Response 200** `{ "message": "Password changed" }`

---

### PATCH /api/user/visibility

**Body**
```json
{ "visibility": "public" }
```

`visibility`: `public` | `friends` | `private`

**Response 200** — updated profile

---

### GET /api/user/notifications

**Query params:** `?unreadOnly=true&limit=20`

**Response 200**
```json
[{ "id": "uuid", "type": "friend_request", "content": "...", "isRead": false, "createdAt": "..." }]
```

---

### PATCH /api/user/notifications/read-all

**Response 200** `{ "message": "All notifications marked read" }`

---

### PATCH /api/user/notifications/:id/read

**Response 200** `{ "message": "Marked read" }`

---

### GET /api/user/:username

Public profile. Returns `403` if the account visibility is `private` and the requester is not a friend.

**Response 200**
```json
{
  "id": "uuid",
  "username": "...",
  "displayName": "...",
  "avatarUrl": null,
  "level": 4,
  "streakCurrent": 7,
  "streakLongest": 14,
  "pet": { "name": "Ember", "species": "blob", "stage": 1 }
}
```

---

## Leaderboard

All routes require authentication.

### GET /api/leaderboard

Global leaderboard. Only users with `visibility = 'public'` appear.

**Query params:** `?sort=streak|xp&limit=25`

**Response 200**
```json
[
  {
    "rank": 1,
    "user": { "id": "...", "username": "...", "displayName": "...", "avatarUrl": null },
    "streakCurrent": 42,
    "xp": 8400
  }
]
```

---

### GET /api/leaderboard/friends

Friends-only leaderboard. Includes the requesting user even if not top-ranked.

**Query params:** `?sort=streak|xp`

**Response 200** — same shape as global leaderboard

---

## Socket.IO events

The server authenticates socket connections via `handshake.auth.token` (the same JWT issued by login/register).

```js
const socket = io('http://localhost:3000', {
  auth: { token: '<jwt>' }
})
```

### Server → Client

| Event | Payload | When |
|---|---|---|
| `pet:updated` | full pet object | After any stat change (feed, completion, cron decay) |
| `notification` | notification object | Real-time delivery of new notifications |
| `friend_request` | request object | When someone sends you a request |
| `gift_received` | gift object | When someone sends you a gift |

### Client → Server

None defined yet. All mutations go through REST; sockets are read-only push channels.
