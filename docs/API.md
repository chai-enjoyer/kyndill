# API reference

HTTP and WebSocket contract for the Kyndill backend. Every route below is currently a stub returning `501 Not Implemented`; the surface is locked first, implementations follow in subsequent prompts.

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

| Method | Path        | Auth | Status | Description                                                  |
| ------ | ----------- | ---- | ------ | ------------------------------------------------------------ |
| POST   | `/register` | no   | 501    | Create an account (email + password). Returns user + JWT.    |
| POST   | `/login`    | no   | 501    | Email + password sign-in. Returns user + JWT.                |
| POST   | `/google`   | no   | 501    | Exchange a Google ID token for a Kyndill JWT.                |
| POST   | `/logout`   | yes  | 501    | Client-side discard. No-op server-side for stateless JWTs.   |
| GET    | `/me`       | yes  | 501    | Returns the authenticated user's profile.                    |

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
