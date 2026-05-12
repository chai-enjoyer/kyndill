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
    `SELECT id, type, content, metadata, is_read, created_at
       FROM notifications
      WHERE user_id = $1 AND is_read = FALSE
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
