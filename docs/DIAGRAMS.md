# Kyndill Diagrams

This document contains source diagrams for thesis and documentation use. Mermaid is used where it gives clean Markdown rendering. PlantUML is used for the use case diagram because it more directly matches UML use case notation.

The deployment diagram reflects the planned Google Cloud shape described in `docs/ARCHITECTURE.md`. Validate it against the final deployment configuration before submitting the thesis.

## Architecture Diagram

```mermaid
flowchart LR
  user[User browser]

  subgraph frontend["Frontend tier"]
    spa[React SPA<br/>Vite build]
    socketClient[socket.io client]
  end

  subgraph backend["Backend tier"]
    api[Express REST API]
    ws[socket.io server]
    cron[node-cron jobs<br/>daily rollover]
    auth[JWT auth<br/>bcrypt passwords<br/>Google OAuth]
  end

  subgraph data["Data tier"]
    db[(PostgreSQL)]
  end

  user --> spa
  spa -->|HTTPS REST /api/*| api
  socketClient -->|WSS realtime events| ws
  spa --- socketClient
  api --> auth
  api --> db
  ws --> auth
  ws --> db
  cron --> db
  api -. emits .-> ws
```

## Entity Relationship Diagram

```mermaid
erDiagram
  USERS {
    uuid id PK
    text email UK
    text password_hash
    text oauth_provider
    text oauth_id
    text display_name
    text username UK
    text bio
    text avatar_url
    int level
    int xp
    int coins
    int streak_current
    int streak_longest
    date last_completion_date
    text visibility
    jsonb notification_prefs
    boolean research_consent
    timestamptz created_at
  }

  PETS {
    uuid id PK
    uuid user_id UK
    text species
    text name
    int health
    int happiness
    int hunger
    int energy
    int cleanliness
    smallint stage
    int total_habits_completed
    boolean is_fainted
    timestamptz last_decay_at
    timestamptz initialized_at
    timestamptz created_at
  }

  HABITS {
    uuid id PK
    uuid user_id FK
    text name
    text description
    text category
    text frequency
    jsonb days_of_week
    time completion_start_time
    time completion_end_time
    int target_count
    boolean is_active
    int sort_order
    timestamptz created_at
  }

  HABIT_COMPLETIONS {
    uuid id PK
    uuid habit_id FK
    uuid user_id FK
    date completed_on
    timestamptz completed_at
    int completion_count
    int target_count
    int xp_earned
    int coins_earned
  }

  STREAKS {
    uuid user_id PK
    int current_streak
    int longest_streak
    smallint freeze_count
    date last_completion_date
  }

  ITEMS {
    uuid id PK
    text name UK
    text type
    text rarity
    int price
    text effect_stat
    int effect_amount
    text image_url
    text category
  }

  INVENTORY {
    uuid user_id PK
    uuid item_id PK
    int quantity
  }

  EQUIPPED_COSMETICS {
    uuid user_id PK
    uuid item_id FK
    text slot PK
  }

  FRIEND_REQUESTS {
    uuid id PK
    uuid from_user_id FK
    uuid to_user_id FK
    text status
    timestamptz created_at
  }

  FRIENDS {
    uuid user_id PK
    uuid friend_id PK
  }

  GIFTS {
    uuid id PK
    uuid from_user_id FK
    uuid to_user_id FK
    uuid item_id FK
    text message
    boolean is_accepted
    timestamptz sent_at
  }

  FOCUS_SESSIONS {
    uuid id PK
    uuid user_id FK
    int duration_minutes
    timestamptz completed_at
    smallint rating
  }

  NOTIFICATIONS {
    uuid id PK
    uuid user_id FK
    text type
    text content
    jsonb metadata
    boolean is_read
    timestamptz created_at
  }

  ACTIVITY_EVENTS {
    uuid id PK
    uuid user_id FK
    text type
    jsonb metadata
    timestamptz created_at
  }

  FEEDBACK_EVENTS {
    uuid id PK
    uuid user_id FK
    uuid habit_id FK
    text context
    text mood
    smallint rating
    text note
    timestamptz created_at
  }

  USERS ||--|| PETS : owns
  USERS ||--|| STREAKS : has
  USERS ||--o{ HABITS : creates
  HABITS ||--o{ HABIT_COMPLETIONS : records
  USERS ||--o{ HABIT_COMPLETIONS : completes
  USERS ||--o{ INVENTORY : owns
  ITEMS ||--o{ INVENTORY : appears_in
  USERS ||--o{ EQUIPPED_COSMETICS : equips
  ITEMS ||--o{ EQUIPPED_COSMETICS : equipped_as
  USERS ||--o{ FRIEND_REQUESTS : sends
  USERS ||--o{ FRIEND_REQUESTS : receives
  USERS ||--o{ FRIENDS : has_edge
  USERS ||--o{ GIFTS : sends
  USERS ||--o{ GIFTS : receives
  ITEMS ||--o{ GIFTS : gifted_item
  USERS ||--o{ FOCUS_SESSIONS : completes
  USERS ||--o{ NOTIFICATIONS : receives
  USERS ||--o{ ACTIVITY_EVENTS : creates
  USERS ||--o{ FEEDBACK_EVENTS : submits
  HABITS ||--o{ FEEDBACK_EVENTS : optional_context
```

## Use Case Diagram

```plantuml
@startuml
left to right direction
actor "User" as User
actor "Friend" as Friend
actor "Google OAuth" as Google

rectangle "Kyndill Platform" {
  usecase "Register / sign in" as UCAuth
  usecase "Complete onboarding" as UCOnboard
  usecase "Create and manage habits" as UCHabits
  usecase "Complete habit logs" as UCComplete
  usecase "Review progress insights" as UCProgress
  usecase "Care for pet" as UCPet
  usecase "Feed pet" as UCFeed
  usecase "Customize pet" as UCCustomize
  usecase "Buy shop items" as UCShop
  usecase "Run focus session" as UCFocus
  usecase "Rate focus session" as UCRateFocus
  usecase "Add friends" as UCFriends
  usecase "Send gifts" as UCGifts
  usecase "View leaderboard" as UCLeaderboard
  usecase "View notifications" as UCNotifications
  usecase "Submit feedback / reflection" as UCFeedback
  usecase "Edit profile and settings" as UCSettings
}

User --> UCAuth
Google --> UCAuth
User --> UCOnboard
User --> UCHabits
User --> UCComplete
User --> UCProgress
User --> UCPet
User --> UCShop
User --> UCFocus
User --> UCFriends
User --> UCLeaderboard
User --> UCNotifications
User --> UCFeedback
User --> UCSettings

UCPet .> UCFeed : <<include>>
UCPet .> UCCustomize : <<include>>
UCShop .> UCCustomize : <<extends>>
UCFocus .> UCRateFocus : <<extends>>
UCFriends .> UCGifts : <<extends>>
Friend --> UCFriends
Friend --> UCGifts
Friend --> UCLeaderboard
@enduml
```

## Habit Completion Sequence

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant SPA as React SPA
  participant API as Express API
  participant Habit as habitService
  participant DB as PostgreSQL
  participant Socket as socket.io

  User->>SPA: Click habit checkbox
  SPA->>SPA: Optimistic completion state
  SPA->>API: POST /api/habits/:id/complete
  API->>Habit: complete(userId, habitId)
  Habit->>DB: BEGIN
  Habit->>DB: Lock habit, completion row, streak row
  alt target count not reached
    Habit->>DB: Insert/update habit_completions progress
    Habit->>DB: Read pet and user snapshot
    Habit->>DB: COMMIT
    Habit-->>API: Partial progress result
  else target reached
    Habit->>DB: Update streaks and users streak mirrors
    Habit->>DB: Insert/update habit_completions with XP and coins
    Habit->>DB: Roll item drop and update inventory if needed
    Habit->>DB: Update users XP, level, coins
    Habit->>DB: Apply pet stat and health effects
    Habit->>DB: Insert notifications and activity_events
    Habit->>DB: COMMIT
    Habit->>Socket: Emit activity_updated, level_up, item_dropped
    Habit->>Socket: Fan out safe friend activity event
    Habit-->>API: Completion reward result
  end
  API-->>SPA: JSON result
  SPA->>SPA: Refresh stats, show toast/modal/confetti
```

## Friend Request And Acceptance Sequence

```mermaid
sequenceDiagram
  autonumber
  actor Sender
  actor Receiver
  participant SenderSPA as Sender SPA
  participant ReceiverSPA as Receiver SPA
  participant API as Express API
  participant Social as socialService
  participant DB as PostgreSQL
  participant Socket as socket.io

  Sender->>SenderSPA: Search username and send request
  SenderSPA->>API: POST /api/social/friends/request
  API->>Social: sendFriendRequest(senderId, username)
  Social->>DB: Validate target user and no duplicate friendship/request
  Social->>DB: Upsert friend_requests as pending
  Social->>DB: Insert friend_request notification
  Social->>Socket: Emit friend_request to receiver
  API-->>SenderSPA: Pending request
  Socket-->>ReceiverSPA: New request notification

  Receiver->>ReceiverSPA: Accept request
  ReceiverSPA->>API: PUT /api/social/friends/request/:id
  API->>Social: respondToFriendRequest(receiverId, requestId, accept)
  Social->>DB: BEGIN
  Social->>DB: Mark request accepted
  Social->>DB: Insert friends edge receiver -> sender
  Social->>DB: Insert friends edge sender -> receiver
  Social->>DB: Insert friendship activity event
  Social->>DB: COMMIT
  Social->>DB: Insert response notification for sender
  Social->>Socket: Emit friend_request_responded to sender
  Social->>Socket: Emit activity_updated
  API-->>ReceiverSPA: Accepted status
```

## Gift Send And Accept Sequence

```mermaid
sequenceDiagram
  autonumber
  actor Sender
  actor Receiver
  participant SenderSPA as Sender SPA
  participant ReceiverSPA as Receiver SPA
  participant API as Express API
  participant Social as socialService
  participant DB as PostgreSQL
  participant Socket as socket.io

  Sender->>SenderSPA: Choose consumable and optional message
  SenderSPA->>API: POST /api/social/gifts/send
  API->>Social: sendGift(senderId, friendId, itemId, message)
  Social->>DB: Check friendship and gift cooldown
  Social->>DB: Check sender inventory and item is consumable
  Social->>DB: BEGIN
  Social->>DB: Decrement sender inventory
  Social->>DB: Insert gifts row
  Social->>DB: Insert gift_received notification
  Social->>DB: Insert gift_sent activity event
  Social->>DB: COMMIT
  Social->>Socket: Emit gift_received to receiver
  API-->>SenderSPA: Gift result
  Socket-->>ReceiverSPA: Gift notification

  Receiver->>ReceiverSPA: Accept gift
  ReceiverSPA->>API: POST /api/social/gifts/:id/accept
  API->>Social: acceptGift(receiverId, giftId)
  Social->>DB: Verify gift belongs to receiver and is not accepted
  Social->>DB: BEGIN
  Social->>DB: Add item to receiver inventory
  Social->>DB: Mark gift accepted
  Social->>DB: COMMIT
  API-->>ReceiverSPA: Updated inventory
```

## Focus Session Completion Sequence

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant SPA as Focus page
  participant Audio as Browser Audio API
  participant API as Express API
  participant Focus as focusService
  participant DB as PostgreSQL

  User->>SPA: Select session type and ambient sound
  SPA->>Audio: Loop selected ambient sound while timer runs
  User->>SPA: Start timer
  SPA->>SPA: Run countdown and circular progress
  SPA->>Audio: Stop ambient sound at completion
  alt no ambient sound selected
    SPA->>Audio: Play completion chime
  end
  SPA->>API: POST /api/focus/complete
  API->>Focus: complete(userId, durationMinutes, optionalRating)
  Focus->>DB: BEGIN
  Focus->>DB: Insert focus_sessions
  Focus->>DB: Add coins to users
  Focus->>DB: Query total focus minutes
  Focus->>DB: COMMIT
  API-->>SPA: session_id, coins_earned, total_focus_time
  SPA->>User: Show completion modal and optional rating
  opt rating after completion
    SPA->>API: PATCH /api/focus/:sessionId/rating
    API->>Focus: rateSession(userId, sessionId, rating)
    Focus->>DB: Update focus_sessions.rating
  end
```

## Pet State Diagram

```mermaid
stateDiagram-v2
  state "Evolution stage" as Evolution {
    [*] --> Seeded : user row inserted
    Seeded --> OnboardingPending : trigger creates default pet
    OnboardingPending --> Baby : user chooses species and name
    Baby --> Teen : total_habits_completed >= 51
    Teen --> Adult : total_habits_completed >= 201
  }

  state "Health state" as Health {
    [*] --> Healthy
    Healthy --> AtRisk : derived health < 40
    AtRisk --> Healthy : habits, feeding, care improve stats
    AtRisk --> Fainted : derived health == 0
    Fainted --> AtRisk : stats recover above 0
    Healthy --> Fainted : severe stat/streak loss
  }

  note right of Health
    Health is derived from streak momentum
    plus happiness, hunger, energy,
    and cleanliness.
  end note
```

## Planned Google Cloud Deployment Diagram

```mermaid
flowchart TB
  user[User browser]

  subgraph gcp["Google Cloud"]
    subgraph firebase["Firebase Hosting"]
      static[Static React build<br/>HTML CSS JS assets]
    end

    subgraph vm["Compute Engine VM"]
      proxy[Caddy or nginx<br/>TLS reverse proxy]
      node[Node.js API process<br/>Express + socket.io + cron]
      postgres[(PostgreSQL<br/>local disk)]
      systemd[systemd process supervision]
    end

    bucket[(Cloud Storage bucket<br/>pg_dump backups)]
  end

  user -->|HTTPS| static
  static -->|HTTPS REST + WSS| proxy
  proxy --> node
  systemd --> node
  node --> postgres
  postgres -->|scheduled logical backup| bucket
```

## Notes For Thesis Screenshots

- Use the architecture diagram to explain the three-tier system boundary.
- Use the ERD to justify how behavioral metrics are generated from persistent tables.
- Use the habit completion sequence to explain reward distribution, pet updates, notifications, and real-time feedback.
- Use the pet state diagram to explain non-punitive but visible companion feedback.
- If the deployed infrastructure differs from the planned Google Cloud diagram, update only the deployment section before final submission.
