# User Data And Logs

This document describes what user-related data Kyndill stores, where it is stored, and which records are used as application logs or evaluation data.

## Storage Overview

Kyndill stores persistent application data in PostgreSQL. The frontend stores only the current JWT access token in browser `localStorage` under `kyndill_token`; profile settings, consent, notification preferences, habits, rewards, pet state, and social data are stored server-side.

Passwords are never stored in plain text. Email/password accounts store a bcrypt password hash in `users.password_hash`. Google sign-in accounts store `oauth_provider = 'google'` and the Google subject identifier in `users.oauth_id`; OAuth-only accounts may have a null password hash.

## Main User Record

The `users` table is the core identity and profile table.

| Data | Columns | Purpose |
| --- | --- | --- |
| Identity | `id`, `email`, `username`, `display_name` | Login, profile display, friend search |
| Authentication | `password_hash`, `oauth_provider`, `oauth_id` | Email/password login and Google OAuth linking |
| Profile | `bio`, `avatar_url`, `visibility` | Public or friend-facing profile |
| Progress | `level`, `xp`, `coins`, `streak_current`, `streak_longest`, `last_completion_date` | Fast dashboard and leaderboard reads |
| Preferences | `notification_prefs`, `research_consent` | Notification filtering and evaluation consent |
| Audit time | `created_at` | Account creation timestamp |

The `users.id` UUID is the main foreign key used by nearly every user-owned table.

## User-Owned Application Data

### Pet Data

Stored in `pets`.

- One pet row exists per user.
- Includes species, pet name, current stats, health, stage, total completed habits, fainted state, last passive decay time, and onboarding completion marker.
- The pet is created automatically by the `trg_users_init_resources` trigger after a user is created.
- Health is recalculated from streak momentum and care stats rather than being treated as a fixed stored-only value.

### Habit Data

Stored in `habits` and `habit_completions`.

- `habits` stores habit name, optional description, category, frequency, weekly days, time window, active state, ordering, and `target_count` for repeated daily completions.
- `habit_completions` stores one row per habit per day, including completion count, target count, timestamp, XP earned, and coins earned.
- Repeating habits increment `completion_count` until `target_count` is reached.

### Streak Data

Stored in `streaks`, with selected values mirrored on `users`.

- `streaks.current_streak`, `longest_streak`, `freeze_count`, and `last_completion_date` are the authoritative streak state.
- New users start with two streak freezes.
- `users.streak_current`, `streak_longest`, and `last_completion_date` are denormalized mirrors for profile and leaderboard reads.

### Inventory, Shop, And Cosmetics

Stored in `items`, `inventory`, and `equipped_cosmetics`.

- `items` is the global catalog for cosmetics, consumables, and streak-freeze purchases.
- `inventory` stores owned item quantities per user.
- `equipped_cosmetics` stores one equipped item per cosmetic slot.
- Consumables affect pet stats; cosmetics are only visible after purchase and equip.

### Social Data

Stored in `friend_requests`, `friends`, and `gifts`.

- `friend_requests` stores incoming and outgoing request state.
- `friends` stores accepted friendships as two directed rows: user A to B and user B to A.
- `gifts` stores sender, recipient, item, optional message, accepted state, and sent timestamp.
- Friend profile views respect profile visibility for streak and total habit history, while level remains public.

### Focus Data

Stored in `focus_sessions`.

- Each completed focus session stores user, duration, completion timestamp, and optional 1-5 rating.
- Focus sessions award coins and contribute to progress statistics.

### Notifications

Stored in `notifications` and, when browser push is enabled, `push_subscriptions`.

- Notifications are user-specific records with type, readable content, JSON metadata, read state, and timestamp.
- Examples include friend requests, friend request responses, gifts, item drops, and level-ups.
- Notification preferences are stored in `users.notification_prefs` and are applied when unread notifications are listed.
- Browser push subscriptions store the push endpoint, browser-provided subscription keys, optional expiry, and user-agent hint for the signed-in device. They do not store notification content; content is generated when sending.
- Push subscriptions are deleted when the user disables push on a browser, when the push service reports an expired subscription, or when the account is deleted.
- Browser push delivery is skipped while the user has an active Socket.IO web session, avoiding duplicate alerts when the user is already on the website.

## Activity And Feedback Logs

Kyndill uses two database-backed log tables for product behavior and evaluation support.

### Activity Events

Stored in `activity_events`.

This is an append-only activity feed used by the dashboard and social surfaces. Current activity types include:

- `habit_completed`
- `purchase`
- `friendship`
- `level_up`
- `gift_sent`

Each row stores:

- `user_id`
- `type`
- `metadata` JSONB
- `created_at`

Privacy behavior:

- The current user can see their own activity metadata.
- Friends can see friend activity in the feed.
- For friend-visible habit completion events, private habit identifiers and names are redacted before the feed response is returned.

### Feedback Events

Stored in `feedback_events`.

This table stores explicit user feedback and reflection data. It supports:

- general feedback from Settings
- mood or rating after habit completion
- recovery reflection after missed habits
- optional habit context through `habit_id`

Each row can include:

- `user_id`
- optional `habit_id`
- `context`
- optional `mood`
- optional `rating`
- optional free-text `note`
- `created_at`

This table is the main place for questionnaire-like and reflection-like evaluation data inside the application database.

## Operational Logs

The backend currently writes operational logs with `console.log` and `console.error`.

Examples:

- API startup message in `backend/src/server.ts`
- graceful shutdown messages for `SIGINT` and `SIGTERM`
- unexpected error logging in `backend/src/middleware/errorHandler.ts`
- database pool idle-client errors in `backend/src/db/pool.ts`
- cron rollover summary and per-user rollover failures in `backend/src/services/cronService.ts`
- socket or activity emission failures in services that emit real-time events

In production on the planned Google Cloud VM, these logs would normally be captured by the process supervisor, such as `systemd` journal, or by whatever logging agent is configured for the VM.

Operational logs are not the primary research dataset. They should be treated as administrative/debugging data and access should be limited to maintainers.

## Client-Side Storage

The frontend stores:

| Key | Location | Purpose |
| --- | --- | --- |
| `kyndill_token` | browser `localStorage` | JWT used for authenticated REST and socket requests |
| theme preference | browser storage through theme utilities | local UI appearance preference |

Consent and notification preferences are not local-only. They are persisted to PostgreSQL through the user profile API.

## Data Created By Important Actions

| User action | Main database changes |
| --- | --- |
| Register with email/password | `users`, trigger-created `pets`, trigger-created `streaks` |
| Register/sign in with Google | `users.oauth_provider`, `users.oauth_id`, optional `avatar_url` |
| Complete onboarding | `pets.species`, `pets.name`, `pets.initialized_at`; optional starter `habits` |
| Create habit | `habits` |
| Complete habit | `habit_completions`, `streaks`, mirrored `users` streak fields, `users.xp`, `users.level`, `users.coins`, `pets`, possible `inventory`, `notifications`, `activity_events` |
| Buy item | `users.coins`, `inventory`, possible `streaks.freeze_count`, `activity_events` |
| Feed pet | `inventory`, `pets` |
| Equip cosmetic | `equipped_cosmetics` |
| Send friend request | `friend_requests`, `notifications`, socket event |
| Accept friend request | `friend_requests`, two `friends` rows, `notifications`, `activity_events` |
| Send gift | sender `inventory`, `gifts`, `notifications`, `activity_events` |
| Accept gift | recipient `inventory`, `gifts.is_accepted` |
| Complete focus session | `focus_sessions`, `users.coins` |
| Submit feedback/reflection | `feedback_events` |
| Update profile/settings | `users` |
| Delete account | `users` row is deleted and related data is removed by cascading foreign keys |

## Deletion And Cascading

Most user-owned tables use `ON DELETE CASCADE` from `users.id`. Deleting a user removes their pet, habits, completions, streak row, inventory, equipped cosmetics, friendships, gifts, focus sessions, notifications, activity events, and feedback events.

Some optional contextual links, such as `feedback_events.habit_id`, use `ON DELETE SET NULL` so that feedback can remain attached to the user even if a specific habit is deleted. If the user account is deleted, the feedback row is also deleted.

## Privacy And Evaluation Notes

- Personal identifying information is not required for research analysis beyond the operational account fields needed by the application.
- Research participation is represented by `users.research_consent`.
- Evaluation can use aggregated behavioral indicators such as completion rates, active days, focus minutes, item purchases, and feedback ratings.
- Habit names should not be exposed in social or research exports unless the user is the owner or explicit consent and anonymization rules allow it.
- Activity metadata and feedback notes can contain user-entered text. Any research export should redact or anonymize free-text fields before analysis.
- Password hashes, OAuth identifiers, JWTs, emails, and avatar images should not be included in research datasets.

## Recommended Export Rules For Thesis Evaluation

For anonymized evaluation, export only derived or pseudonymized records:

- replace `user_id` with a generated participant code
- include aggregated habit completion counts and rates
- include active days and focus minutes
- include achievement or reward counts if needed
- include feedback ratings and coded themes from notes, not raw identifying text
- exclude email, password hash, OAuth id, avatar, JWT, raw notification metadata, and gift messages

These rules align the implementation with a low-data, privacy-aware evaluation model while keeping the platform functional for real users.
