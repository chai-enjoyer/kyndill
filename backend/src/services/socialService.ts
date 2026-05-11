import { query } from '../lib/db'
import { AppError } from '../middleware/errorHandler'
import type { SendGiftInput } from '../types'

// ─── Friends ──────────────────────────────────────────────────────────────────

// TODO: SELECT users.* FROM friends JOIN users ON friend_id = users.id WHERE friends.user_id = $1
export async function listFriends(_userId: string): Promise<unknown[]> {
  throw new AppError(501, 'Not implemented')
}

// TODO: SELECT * FROM friend_requests WHERE to_user_id = $1 AND status = 'pending'
export async function listFriendRequests(_userId: string): Promise<unknown[]> {
  throw new AppError(501, 'Not implemented')
}

// TODO: INSERT into friend_requests (check no existing pending/accepted request)
export async function sendFriendRequest(_fromUserId: string, _toUserId: string): Promise<unknown> {
  throw new AppError(501, 'Not implemented')
}

// TODO: UPDATE friend_requests SET status = $1 WHERE id = $2 AND to_user_id = $3
//       If accepted: INSERT both directions into friends
export async function respondToFriendRequest(
  _userId: string,
  _requestId: string,
  _action: 'accepted' | 'rejected',
): Promise<void> {
  throw new AppError(501, 'Not implemented')
}

// TODO: DELETE FROM friends WHERE (user_id=$1 AND friend_id=$2) OR (user_id=$2 AND friend_id=$1)
export async function removeFriend(_userId: string, _friendId: string): Promise<void> {
  throw new AppError(501, 'Not implemented')
}

// ─── Gifts ────────────────────────────────────────────────────────────────────

// TODO: SELECT gifts.*, items.* FROM gifts JOIN items ON item_id = items.id
//       WHERE to_user_id = $1 AND is_accepted IS NULL
export async function listGifts(_userId: string): Promise<unknown[]> {
  throw new AppError(501, 'Not implemented')
}

// TODO: verify sender owns item (quantity > 0), INSERT gift, deduct from inventory
export async function sendGift(_fromUserId: string, _input: SendGiftInput): Promise<unknown> {
  throw new AppError(501, 'Not implemented')
}

// TODO: UPDATE gifts SET is_accepted = $1, add item to recipient inventory if accepted
export async function respondToGift(
  _userId: string,
  _giftId: string,
  _action: 'accept' | 'decline',
): Promise<void> {
  throw new AppError(501, 'Not implemented')
}

// ─── Search ───────────────────────────────────────────────────────────────────

// TODO: SELECT id, username, display_name, avatar_url FROM users
//       WHERE username ILIKE $1 AND visibility != 'private' LIMIT 20
export async function searchUsers(_query: string, _requestingUserId: string): Promise<unknown[]> {
  throw new AppError(501, 'Not implemented')
}

export { query }
