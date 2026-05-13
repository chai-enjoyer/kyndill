import { pool } from '../db/pool';

export interface NotificationRow {
  id: string;
  type: string;
  content: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export async function listUnread(userId: string): Promise<NotificationRow[]> {
  const { rows } = await pool.query<NotificationRow>(
    `SELECT n.id, n.type, n.content, n.metadata, n.is_read, n.created_at
       FROM notifications n
       JOIN users u ON u.id = n.user_id
      WHERE n.user_id = $1
        AND is_read = FALSE
        AND CASE
          WHEN n.type IN ('friend_request', 'friend_request_response') THEN
            COALESCE((u.notification_prefs->>'friendRequests')::boolean, TRUE)
          WHEN n.type IN ('gift_received', 'gift_sent') THEN
            COALESCE((u.notification_prefs->>'gifts')::boolean, TRUE)
          ELSE TRUE
        END
      ORDER BY created_at DESC`,
    [userId],
  );
  return rows;
}

export async function markAllRead(userId: string): Promise<void> {
  await pool.query(
    `UPDATE notifications SET is_read = TRUE
      WHERE user_id = $1 AND is_read = FALSE`,
    [userId],
  );
}
