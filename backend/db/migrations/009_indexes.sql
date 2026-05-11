-- Foreign key indexes (Postgres does not auto-index FKs)
CREATE INDEX idx_habits_user_id              ON habits(user_id);
CREATE INDEX idx_habit_completions_habit_id  ON habit_completions(habit_id);
CREATE INDEX idx_habit_completions_user_id   ON habit_completions(user_id);
CREATE INDEX idx_inventory_item_id           ON inventory(item_id);
CREATE INDEX idx_equipped_cosmetics_item_id  ON equipped_cosmetics(item_id);
CREATE INDEX idx_friend_requests_from        ON friend_requests(from_user_id);
CREATE INDEX idx_friend_requests_to          ON friend_requests(to_user_id);
CREATE INDEX idx_friends_friend_id           ON friends(friend_id);
CREATE INDEX idx_gifts_from                  ON gifts(from_user_id);
CREATE INDEX idx_gifts_to                    ON gifts(to_user_id);
CREATE INDEX idx_gifts_item_id               ON gifts(item_id);
CREATE INDEX idx_focus_sessions_user_id      ON focus_sessions(user_id);
CREATE INDEX idx_notifications_user_id       ON notifications(user_id);
CREATE INDEX idx_activity_events_user_id     ON activity_events(user_id);

-- Time-ordered access patterns
CREATE INDEX idx_habit_completions_user_date    ON habit_completions(user_id, completed_on DESC);
CREATE INDEX idx_habit_completions_completed_on ON habit_completions(completed_on);
CREATE INDEX idx_focus_sessions_user_completed  ON focus_sessions(user_id, completed_at DESC);
CREATE INDEX idx_notifications_user_unread      ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_activity_events_user_created   ON activity_events(user_id, created_at DESC);

-- Filtered lookups
CREATE INDEX idx_habits_user_active             ON habits(user_id, is_active);
CREATE INDEX idx_friend_requests_to_status      ON friend_requests(to_user_id, status);

-- username UNIQUE constraint already provides a lookup index on users(username)
-- pets(user_id) UNIQUE constraint already provides a lookup index
