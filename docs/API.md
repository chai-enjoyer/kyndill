# API reference

HTTP and WebSocket contract for the Kyndill backend. Routes marked `501` are still stubs; the auth surface is fully implemented.

## Base URL

- Local: `http://localhost:3000`
- Production: TBD

## Conventions

- All requests and responses are JSON.
- Timestamps are ISO 8601 in UTC.
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

| Method | Path                | Status | Description                                                    |
| ------ | ------------------- | ------ | -------------------------------------------------------------- |
| GET    | `/`                 | 501    | List the caller's habits (active and archived).                |
| POST   | `/`                 | 501    | Create a new habit.                                            |
| GET    | `/:id`              | 501    | Get a single habit by id.                                      |
| PATCH  | `/:id`              | 501    | Update name, description, category, frequency, schedule.      |
| DELETE | `/:id`              | 501    | Archive (soft delete via `is_active = false`).                 |
| POST   | `/:id/complete`     | 501    | Mark the habit complete for today; awards xp + coins.          |
| GET    | `/:id/completions`  | 501    | Completion history; supports `?from` and `?to` query params.   |

## Pet (`/api/pet`, all auth)

| Method | Path        | Status | Description                                                    |
| ------ | ----------- | ------ | -------------------------------------------------------------- |
| GET    | `/`         | 501    | Current pet state for the caller (stats, stage, mood).         |
| PATCH  | `/`         | 501    | Update the pet's name (or species after unlock).               |
| POST   | `/consume`  | 501    | Apply a consumable from inventory to the pet.                  |

## Shop (`/api/shop`, all auth)

| Method | Path          | Status | Description                                                |
| ------ | ------------- | ------ | ---------------------------------------------------------- |
| GET    | `/items`      | 501    | Full item catalogue (filterable by `?type` and `?rarity`). |
| POST   | `/purchase`   | 501    | Buy an item with coins; deducts coins and grants inventory.|
| GET    | `/inventory`  | 501    | Caller's inventory with quantities.                         |
| POST   | `/equip`      | 501    | Equip a cosmetic to its slot (hat / accessory / background).|
| POST   | `/unequip`    | 501    | Clear a cosmetic slot.                                     |

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

Mounted at the same origin via socket.io. JWT verification on the handshake will be added in a later prompt; the stub currently accepts every connection.

### Client to server

| Event | Payload | Description           |
| ----- | ------- | --------------------- |
| _none yet_ |     |                       |

### Server to client

| Event | Payload | Description           |
| ----- | ------- | --------------------- |
| _none yet_ |     |                       |
