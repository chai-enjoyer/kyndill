import { pool } from '../db/pool';
import { HttpError } from '../middleware/errorHandler';
import { emitToUser } from '../socket/socketHandler';
import {
  emitActivityUpdated,
  listForUser as listActivityForUser,
  recordActivity,
  type ActivityEntry,
} from './activityService';
import { listForUser as listInventory } from './inventoryService';
import type { InventoryListing } from './inventoryService';
import { sendNotificationPush } from './notificationsService';

// ============================================================
// DTOs
// ============================================================

export interface FriendDto {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  level: number;
  streak_current: number | null;
}

export interface FriendRequestDto {
  id: string;
  from_user_id: string;
  from_username: string;
  from_display_name: string;
  from_avatar_url: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface SentFriendRequestDto {
  id: string;
  to_user_id: string;
  to_username: string;
  to_display_name: string;
  to_avatar_url: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface GiftDto {
  id: string;
  from_user_id: string;
  to_user_id: string;
  item_id: string;
  message: string | null;
  is_accepted: boolean;
  sent_at: string;
}

export interface ReceivedGiftDto extends GiftDto {
  from_username: string;
  from_display_name: string;
  from_avatar_url: string | null;
  item_name: string;
  item_image_url: string | null;
}

export interface SendGiftResult {
  gift: GiftDto;
  item: { id: string; name: string; image_url: string | null };
}

export interface AcceptGiftResult {
  gift: GiftDto;
  inventory: InventoryListing;
}

// ============================================================
// Friends
// ============================================================

export async function listFriends(userId: string): Promise<FriendDto[]> {
  const { rows } = await pool.query<{
    id: string;
    display_name: string;
    username: string;
    avatar_url: string | null;
    level: number;
    streak_current: number;
    visibility: 'public' | 'friends' | 'private';
  }>(
    `SELECT u.id, u.display_name, u.username, u.avatar_url, u.level,
            u.streak_current, u.visibility
       FROM friends f
       JOIN users u ON u.id = f.friend_id
      WHERE f.user_id = $1
      ORDER BY u.display_name ASC`,
    [userId],
  );

  return rows.map((row) => ({
    id: row.id,
    display_name: row.display_name,
    username: row.username,
    avatar_url: row.avatar_url,
    level: row.level,
    streak_current: row.visibility === 'private' ? null : row.streak_current,
  }));
}

export async function sendFriendRequest(
  fromUserId: string,
  toUsername: string,
): Promise<FriendRequestDto> {
  const { rows: targets } = await pool.query<{ id: string }>(
    `SELECT id FROM users WHERE username = $1`,
    [toUsername],
  );
  if (targets.length === 0) {
    throw new HttpError(404, 'USER_NOT_FOUND', 'No user with that username');
  }
  const toUserId = targets[0].id;

  if (toUserId === fromUserId) {
    throw new HttpError(400, 'INVALID_TARGET', 'You cannot send a friend request to yourself');
  }

  const { rows: friendship } = await pool.query(
    `SELECT 1 FROM friends WHERE user_id = $1 AND friend_id = $2`,
    [fromUserId, toUserId],
  );
  if (friendship.length > 0) {
    throw new HttpError(409, 'ALREADY_FRIENDS', 'You are already friends');
  }

  await pool.query(
    `DELETE FROM friend_requests
      WHERE status = 'rejected'
        AND (
          (from_user_id = $1 AND to_user_id = $2)
          OR
          (from_user_id = $2 AND to_user_id = $1)
        )`,
    [fromUserId, toUserId],
  );

  const { rows: pendingOut } = await pool.query(
    `SELECT 1 FROM friend_requests
      WHERE from_user_id = $1 AND to_user_id = $2 AND status = 'pending'`,
    [fromUserId, toUserId],
  );
  if (pendingOut.length > 0) {
    throw new HttpError(409, 'REQUEST_PENDING', 'A request to this user is already pending');
  }

  const { rows: pendingIn } = await pool.query(
    `SELECT 1 FROM friend_requests
      WHERE from_user_id = $1 AND to_user_id = $2 AND status = 'pending'`,
    [toUserId, fromUserId],
  );
  if (pendingIn.length > 0) {
    throw new HttpError(
      409,
      'REQUEST_PENDING_INBOUND',
      'They already sent you a friend request; accept it instead',
    );
  }

  // UPSERT so a previously rejected request can be re-issued.
  const { rows: inserted } = await pool.query<{
    id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
  }>(
    `INSERT INTO friend_requests (from_user_id, to_user_id, status)
     VALUES ($1, $2, 'pending')
     ON CONFLICT (from_user_id, to_user_id)
     DO UPDATE SET status = 'pending', created_at = NOW()
     RETURNING id, status, created_at`,
    [fromUserId, toUserId],
  );
  const requestRow = inserted[0];

  const { rows: senderRows } = await pool.query<{
    username: string;
    display_name: string;
    avatar_url: string | null;
  }>(
    `SELECT username, display_name, avatar_url FROM users WHERE id = $1`,
    [fromUserId],
  );
  const sender = senderRows[0] ?? { username: '', display_name: '', avatar_url: null };
  const requestContent = `${sender.display_name || sender.username} sent you a friend request`;

  await pool.query(
    `INSERT INTO notifications (user_id, type, content, metadata)
     VALUES ($1, 'friend_request', $2, $3::jsonb)`,
    [
      toUserId,
      requestContent,
      JSON.stringify({
        request_id: requestRow.id,
        from_user_id: fromUserId,
        from_username: sender.username,
        from_display_name: sender.display_name,
      }),
    ],
  );

  emitToUser(toUserId, 'friend_request', {
    request_id: requestRow.id,
    from_user_id: fromUserId,
    from_username: sender.username,
    from_display_name: sender.display_name,
    from_avatar_url: sender.avatar_url,
  });
  void sendNotificationPush(toUserId, 'friend_request', requestContent).catch((err) => {
    console.error('friend_request push failed:', err);
  });

  return {
    id: requestRow.id,
    from_user_id: fromUserId,
    from_username: sender.username,
    from_display_name: sender.display_name,
    from_avatar_url: sender.avatar_url,
    status: requestRow.status,
    created_at: requestRow.created_at,
  };
}

export async function listFriendRequests(userId: string): Promise<FriendRequestDto[]> {
  const { rows } = await pool.query<FriendRequestDto>(
    `SELECT fr.id,
            fr.from_user_id,
            u.username       AS from_username,
            u.display_name   AS from_display_name,
            u.avatar_url     AS from_avatar_url,
            fr.status,
            fr.created_at
       FROM friend_requests fr
       JOIN users u ON u.id = fr.from_user_id
      WHERE fr.to_user_id = $1 AND fr.status = 'pending'
      ORDER BY fr.created_at DESC`,
    [userId],
  );
  return rows;
}

export async function listSentFriendRequests(userId: string): Promise<SentFriendRequestDto[]> {
  const { rows } = await pool.query<SentFriendRequestDto>(
    `SELECT fr.id,
            fr.to_user_id,
            u.username       AS to_username,
            u.display_name   AS to_display_name,
            u.avatar_url     AS to_avatar_url,
            fr.status,
            fr.created_at
       FROM friend_requests fr
       JOIN users u ON u.id = fr.to_user_id
      WHERE fr.from_user_id = $1 AND fr.status = 'pending'
      ORDER BY fr.created_at DESC`,
    [userId],
  );
  return rows;
}

export async function cancelSentFriendRequest(
  userId: string,
  requestId: string,
): Promise<void> {
  const { rows } = await pool.query<{
    id: string;
    from_user_id: string;
    to_user_id: string;
    status: string;
  }>(
    `SELECT id, from_user_id, to_user_id, status FROM friend_requests WHERE id = $1`,
    [requestId],
  );
  const row = rows[0];
  if (!row || row.from_user_id !== userId) {
    throw new HttpError(404, 'NOT_FOUND', 'Friend request not found');
  }
  if (row.status !== 'pending') {
    throw new HttpError(409, 'ALREADY_RESPONDED', `Request was already ${row.status}`);
  }

  // Drop the request and any unread notification the recipient may still have
  // open for it, so the cancellation feels symmetric on both sides.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM friend_requests WHERE id = $1`, [requestId]);
    await client.query(
      `DELETE FROM notifications
        WHERE user_id = $1
          AND type = 'friend_request'
          AND metadata->>'request_id' = $2`,
      [row.to_user_id, requestId],
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  emitToUser(row.to_user_id, 'friend_request_cancelled', {
    request_id: requestId,
    from_user_id: userId,
  });
}

export interface RespondResult {
  id: string;
  status: 'accepted' | 'rejected';
}

export async function respondToFriendRequest(
  userId: string,
  requestId: string,
  action: 'accept' | 'reject',
): Promise<RespondResult> {
  const { rows: requests } = await pool.query<{
    id: string;
    from_user_id: string;
    to_user_id: string;
    status: string;
  }>(
    `SELECT id, from_user_id, to_user_id, status FROM friend_requests WHERE id = $1`,
    [requestId],
  );
  if (requests.length === 0 || requests[0].to_user_id !== userId) {
    throw new HttpError(404, 'NOT_FOUND', 'Friend request not found');
  }
  const reqRow = requests[0];
  if (reqRow.status !== 'pending') {
    throw new HttpError(409, 'ALREADY_RESPONDED', `Request was already ${reqRow.status}`);
  }

  const newStatus: 'accepted' | 'rejected' = action === 'accept' ? 'accepted' : 'rejected';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`UPDATE friend_requests SET status = $1 WHERE id = $2`, [
      newStatus,
      requestId,
    ]);

    if (action === 'accept') {
      await client.query(
        `INSERT INTO friends (user_id, friend_id) VALUES ($1, $2)
         ON CONFLICT (user_id, friend_id) DO NOTHING`,
        [userId, reqRow.from_user_id],
      );
      await client.query(
        `INSERT INTO friends (user_id, friend_id) VALUES ($1, $2)
         ON CONFLICT (user_id, friend_id) DO NOTHING`,
        [reqRow.from_user_id, userId],
      );

      const { rows: pairRows } = await client.query<{
        id: string;
        username: string;
        display_name: string;
      }>(
        `SELECT id, username, display_name
           FROM users
          WHERE id = ANY($1::uuid[])`,
        [[userId, reqRow.from_user_id]],
      );
      const byId = new Map(pairRows.map((row) => [row.id, row]));
      const friend = byId.get(reqRow.from_user_id);
      const actor = byId.get(userId);
      await recordActivity(client, userId, 'friendship', {
        friend_id: reqRow.from_user_id,
        friend_username: friend?.username ?? '',
        friend_display_name: friend?.display_name ?? 'A friend',
        actor_username: actor?.username ?? '',
        actor_display_name: actor?.display_name ?? 'You',
      });
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const { rows: responderRows } = await pool.query<{
    username: string;
    display_name: string;
  }>(
    `SELECT username, display_name FROM users WHERE id = $1`,
    [userId],
  );
  const responder = responderRows[0] ?? { username: '', display_name: '' };
  const responseContent = `${responder.display_name || responder.username} ${newStatus} your friend request`;

  await pool.query(
    `INSERT INTO notifications (user_id, type, content, metadata)
     VALUES ($1, 'friend_request_response', $2, $3::jsonb)`,
    [
      reqRow.from_user_id,
      responseContent,
      JSON.stringify({
        request_id: requestId,
        status: newStatus,
        responder_id: userId,
        responder_username: responder.username,
        responder_display_name: responder.display_name,
      }),
    ],
  );

  emitToUser(reqRow.from_user_id, 'friend_request_responded', {
    request_id: requestId,
    status: newStatus,
    responder_id: userId,
    responder_username: responder.username,
    responder_display_name: responder.display_name,
  });
  void sendNotificationPush(reqRow.from_user_id, 'friend_request_response', responseContent).catch((err) => {
    console.error('friend_request_response push failed:', err);
  });

  if (action === 'accept') {
    void emitActivityUpdated(userId).catch((err) => {
      console.error('activity_updated emit failed:', err);
    });
  }

  return { id: requestId, status: newStatus };
}

export async function removeFriend(userId: string, friendId: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM friends WHERE user_id = $1 AND friend_id = $2`, [
      userId,
      friendId,
    ]);
    await client.query(`DELETE FROM friends WHERE user_id = $1 AND friend_id = $2`, [
      friendId,
      userId,
    ]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ============================================================
// Gifts
// ============================================================

export async function sendGift(
  fromUserId: string,
  toUserId: string,
  itemId: string,
  message?: string,
): Promise<SendGiftResult> {
  const { rows: friendship } = await pool.query(
    `SELECT 1 FROM friends WHERE user_id = $1 AND friend_id = $2`,
    [fromUserId, toUserId],
  );
  if (friendship.length === 0) {
    throw new HttpError(404, 'NOT_FRIENDS', 'You are not friends with this user');
  }

  const { rows: invRows } = await pool.query<{
    quantity: number;
    type: string;
    name: string;
    image_url: string | null;
  }>(
    `SELECT inv.quantity, i.type, i.name, i.image_url
       FROM inventory inv
       JOIN items i ON i.id = inv.item_id
      WHERE inv.user_id = $1 AND inv.item_id = $2`,
    [fromUserId, itemId],
  );
  if (invRows.length === 0 || invRows[0].quantity < 1) {
    throw new HttpError(404, 'NOT_IN_INVENTORY', 'Item not in inventory');
  }
  if (invRows[0].type !== 'consumable') {
    throw new HttpError(400, 'NOT_GIFTABLE', 'Only consumables can be gifted');
  }
  const itemInfo = invRows[0];

  const { rows: senderRows } = await pool.query<{
    username: string;
    display_name: string;
  }>(
    `SELECT username, display_name FROM users WHERE id = $1`,
    [fromUserId],
  );
  const sender = senderRows[0] ?? { username: '', display_name: '' };
  const senderName = sender.display_name || sender.username || 'A friend';
  const cleanMessage = message?.trim() || null;

  const { rows: existing } = await pool.query(
    `SELECT 1 FROM gifts
      WHERE from_user_id = $1
        AND to_user_id = $2
        AND (sent_at AT TIME ZONE 'UTC')::date = (NOW() AT TIME ZONE 'UTC')::date`,
    [fromUserId, toUserId],
  );
  if (existing.length > 0) {
    throw new HttpError(
      429,
      'GIFT_COOLDOWN',
      'You can only send one gift per friend per day',
    );
  }

  const client = await pool.connect();
  let gift: GiftDto;
  const giftContent = cleanMessage
    ? `${senderName} sent you ${itemInfo.name} as a gift: ${cleanMessage}`
    : `${senderName} sent you ${itemInfo.name} as a gift`;
  try {
    await client.query('BEGIN');

    if (itemInfo.quantity === 1) {
      await client.query(`DELETE FROM inventory WHERE user_id = $1 AND item_id = $2`, [
        fromUserId,
        itemId,
      ]);
    } else {
      await client.query(
        `UPDATE inventory SET quantity = quantity - 1
          WHERE user_id = $1 AND item_id = $2`,
        [fromUserId, itemId],
      );
    }

    const { rows: giftRows } = await client.query<GiftDto>(
      `INSERT INTO gifts (from_user_id, to_user_id, item_id, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, from_user_id, to_user_id, item_id, message, is_accepted, sent_at`,
      [fromUserId, toUserId, itemId, cleanMessage],
    );
    gift = giftRows[0];

    await client.query(
      `INSERT INTO notifications (user_id, type, content, metadata)
       VALUES ($1, 'gift_received', $2, $3::jsonb)`,
      [
        toUserId,
        giftContent,
        JSON.stringify({
          gift_id: gift.id,
          item_id: itemId,
          item_name: itemInfo.name,
          from_user_id: fromUserId,
          from_username: sender.username,
          from_display_name: sender.display_name,
          message: cleanMessage,
        }),
      ],
    );

    await recordActivity(client, fromUserId, 'gift_sent', {
      to_user_id: toUserId,
      item_id: itemId,
      item_name: itemInfo.name,
    });

    await client.query('COMMIT');
    void emitActivityUpdated(fromUserId).catch((err) => {
      console.error('activity_updated emit failed:', err);
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  emitToUser(toUserId, 'gift_received', {
    gift_id: gift.id,
    from_user_id: fromUserId,
    from_username: sender.username,
    from_display_name: sender.display_name,
    item_id: itemId,
    item_name: itemInfo.name,
    item_image_url: itemInfo.image_url,
    message: cleanMessage,
  });
  void sendNotificationPush(toUserId, 'gift_received', giftContent).catch((err) => {
    console.error('gift_received push failed:', err);
  });

  return {
    gift,
    item: { id: itemId, name: itemInfo.name, image_url: itemInfo.image_url },
  };
}

export async function listReceivedGifts(userId: string): Promise<ReceivedGiftDto[]> {
  const { rows } = await pool.query<ReceivedGiftDto>(
    `SELECT g.id,
            g.from_user_id,
            g.to_user_id,
            g.item_id,
            g.message,
            g.is_accepted,
            g.sent_at,
            u.username AS from_username,
            u.display_name AS from_display_name,
            u.avatar_url AS from_avatar_url,
            i.name AS item_name,
            i.image_url AS item_image_url
       FROM gifts g
       JOIN users u ON u.id = g.from_user_id
       JOIN items i ON i.id = g.item_id
      WHERE g.to_user_id = $1
        AND g.is_accepted = FALSE
      ORDER BY g.sent_at DESC`,
    [userId],
  );
  return rows;
}

export async function acceptGift(userId: string, giftId: string): Promise<AcceptGiftResult> {
  const { rows: gifts } = await pool.query<GiftDto>(
    `SELECT id, from_user_id, to_user_id, item_id, message, is_accepted, sent_at
       FROM gifts WHERE id = $1`,
    [giftId],
  );
  if (gifts.length === 0 || gifts[0].to_user_id !== userId) {
    throw new HttpError(404, 'NOT_FOUND', 'Gift not found');
  }
  if (gifts[0].is_accepted) {
    throw new HttpError(409, 'ALREADY_ACCEPTED', 'Gift was already accepted');
  }
  const giftRow = gifts[0];

  const client = await pool.connect();
  let updated: GiftDto;
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO inventory (user_id, item_id, quantity)
       VALUES ($1, $2, 1)
       ON CONFLICT (user_id, item_id)
       DO UPDATE SET quantity = inventory.quantity + 1`,
      [userId, giftRow.item_id],
    );

    const { rows: updatedRows } = await client.query<GiftDto>(
      `UPDATE gifts SET is_accepted = TRUE WHERE id = $1
       RETURNING id, from_user_id, to_user_id, item_id, message, is_accepted, sent_at`,
      [giftId],
    );
    updated = updatedRows[0];

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  const inventory = await listInventory(userId);
  return { gift: updated, inventory };
}

// ============================================================
// Activity feed
// ============================================================

export async function listActivity(userId: string): Promise<ActivityEntry[]> {
  return listActivityForUser(userId);
}
