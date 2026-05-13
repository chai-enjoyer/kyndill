import type { PoolClient } from 'pg';
import { pool } from '../db/pool';
import { emitToUser } from '../socket/socketHandler';

export type ActivityType =
  | 'habit_completed'
  | 'purchase'
  | 'friendship'
  | 'level_up'
  | 'gift_sent';

export interface ActivityEntry {
  id: string;
  user_id: string;
  user_display_name: string;
  user_username: string;
  user_avatar_url: string | null;
  type: ActivityType | string;
  metadata: Record<string, unknown>;
  created_at: string;
  is_current_user: boolean;
}

interface ActivityRow extends Omit<ActivityEntry, 'metadata'> {
  metadata: Record<string, unknown> | null;
}

export async function recordActivity(
  client: PoolClient,
  userId: string,
  type: ActivityType,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await client.query(
    `INSERT INTO activity_events (user_id, type, metadata)
     VALUES ($1, $2, $3::jsonb)`,
    [userId, type, JSON.stringify(metadata)],
  );
}

export async function listForUser(userId: string): Promise<ActivityEntry[]> {
  const { rows } = await pool.query<ActivityRow>(
    `SELECT ae.id,
            ae.user_id,
            u.display_name AS user_display_name,
            u.username AS user_username,
            u.avatar_url AS user_avatar_url,
            ae.type,
            ae.metadata,
            ae.created_at,
            (ae.user_id = $1) AS is_current_user
       FROM activity_events ae
       JOIN users u ON u.id = ae.user_id
      WHERE ae.user_id = $1
         OR ae.user_id IN (SELECT friend_id FROM friends WHERE user_id = $1)
      ORDER BY ae.created_at DESC
      LIMIT 30`,
    [userId],
  );

  return rows.map((row) => ({
    ...row,
    metadata: redactForViewer(row.metadata ?? {}, row),
  }));
}

export async function emitActivityUpdated(userId: string): Promise<void> {
  emitToUser(userId, 'activity_updated', { actor_user_id: userId });

  const { rows } = await pool.query<{ friend_id: string }>(
    `SELECT friend_id FROM friends WHERE user_id = $1`,
    [userId],
  );
  for (const friend of rows) {
    emitToUser(friend.friend_id, 'activity_updated', { actor_user_id: userId });
  }
}

function redactForViewer(
  metadata: Record<string, unknown>,
  row: Pick<ActivityEntry, 'type' | 'is_current_user'>,
): Record<string, unknown> {
  if (row.is_current_user || row.type !== 'habit_completed') return metadata;

  const safeMetadata = { ...metadata };
  delete safeMetadata.habit_id;
  delete safeMetadata.habit_name;
  return safeMetadata;
}
