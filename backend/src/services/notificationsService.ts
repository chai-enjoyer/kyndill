import { pool } from '../db/pool';
import { sendPushToUser } from './pushService';

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

export async function sendNotificationPush(
  userId: string,
  type: string,
  content: string,
): Promise<void> {
  await sendPushToUser(
    userId,
    {
      title: notificationTitle(type),
      body: content,
      url: notificationUrl(type),
      tag: type,
    },
    type,
  );
}

function notificationTitle(type: string): string {
  switch (type) {
    case 'friend_request':
      return 'New friend request';
    case 'friend_request_response':
      return 'Friend request update';
    case 'gift_received':
      return 'A gift for you';
    case 'item_drop':
      return 'New drop';
    case 'level_up':
      return 'Level up';
    default:
      return 'Kyndill';
  }
}

function notificationUrl(type: string): string {
  switch (type) {
    case 'friend_request':
    case 'friend_request_response':
    case 'gift_received':
      return '/friends';
    case 'item_drop':
    case 'level_up':
      return '/';
    default:
      return '/';
  }
}
