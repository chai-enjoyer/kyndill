import webPush from 'web-push';
import { pool } from '../db/pool';

export interface BrowserPushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
}

interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

type PushSendError = Error & { statusCode?: number };

const publicKey = process.env.VAPID_PUBLIC_KEY?.trim() ?? '';
const privateKey = process.env.VAPID_PRIVATE_KEY?.trim() ?? '';
const subject = process.env.VAPID_SUBJECT?.trim() || 'mailto:admin@kyndill.local';

if (publicKey && privateKey) {
  webPush.setVapidDetails(subject, publicKey, privateKey);
}

export function getPublicKey(): string | null {
  return publicKey && privateKey ? publicKey : null;
}

export function isConfigured(): boolean {
  return Boolean(publicKey && privateKey);
}

export async function saveSubscription(
  userId: string,
  subscription: BrowserPushSubscription,
  userAgent?: string,
): Promise<void> {
  const expirationTime =
    typeof subscription.expirationTime === 'number'
      ? new Date(subscription.expirationTime)
      : null;

  await pool.query(
    `INSERT INTO push_subscriptions
       (user_id, endpoint, p256dh, auth, expiration_time, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (endpoint)
     DO UPDATE SET
       user_id = EXCLUDED.user_id,
       p256dh = EXCLUDED.p256dh,
       auth = EXCLUDED.auth,
       expiration_time = EXCLUDED.expiration_time,
       user_agent = EXCLUDED.user_agent,
       updated_at = NOW()`,
    [
      userId,
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth,
      expirationTime,
      userAgent ?? null,
    ],
  );
}

export async function deleteSubscription(userId: string, endpoint: string): Promise<void> {
  await pool.query(
    `DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`,
    [userId, endpoint],
  );
}

export async function countSubscriptions(userId: string): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM push_subscriptions WHERE user_id = $1`,
    [userId],
  );
  return Number(rows[0]?.count ?? 0);
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
  notificationType = 'general',
): Promise<void> {
  if (!isConfigured()) return;
  if (!(await shouldSendPush(userId, notificationType))) return;

  const { rows } = await pool.query<PushSubscriptionRow>(
    `SELECT endpoint, p256dh, auth
       FROM push_subscriptions
      WHERE user_id = $1`,
    [userId],
  );
  if (rows.length === 0) return;

  await Promise.allSettled(
    rows.map(async (row) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: {
              p256dh: row.p256dh,
              auth: row.auth,
            },
          },
          JSON.stringify({
            icon: '/favicon.svg',
            tag: notificationType,
            ...payload,
          }),
        );
      } catch (err) {
        const pushError = err as PushSendError;
        if (pushError.statusCode === 404 || pushError.statusCode === 410) {
          await pool.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [row.endpoint]);
          return;
        }
        console.error('push notification failed:', pushError.message);
      }
    }),
  );
}

async function shouldSendPush(userId: string, notificationType: string): Promise<boolean> {
  const { rows } = await pool.query<{
    friend_requests: boolean;
    gifts: boolean;
    focus_reminders: boolean;
    daily_reminder: boolean;
    mood_ping: boolean;
  }>(
    `SELECT
        COALESCE((notification_prefs->>'friendRequests')::boolean, TRUE) AS friend_requests,
        COALESCE((notification_prefs->>'gifts')::boolean, TRUE) AS gifts,
        COALESCE((notification_prefs->>'focusReminders')::boolean, TRUE) AS focus_reminders,
        COALESCE((notification_prefs->>'dailyReminder')::boolean, TRUE) AS daily_reminder,
        COALESCE((notification_prefs->>'moodPing')::boolean, FALSE) AS mood_ping
       FROM users
      WHERE id = $1`,
    [userId],
  );
  const prefs = rows[0];
  if (!prefs) return false;
  if (notificationType === 'friend_request' || notificationType === 'friend_request_response') {
    return prefs.friend_requests;
  }
  if (notificationType === 'gift_received' || notificationType === 'gift_sent') {
    return prefs.gifts;
  }
  if (notificationType === 'focus_reminder') {
    return prefs.focus_reminders;
  }
  if (notificationType === 'daily_reminder') {
    return prefs.daily_reminder;
  }
  if (notificationType === 'mood_ping') {
    return prefs.mood_ping;
  }
  return true;
}
