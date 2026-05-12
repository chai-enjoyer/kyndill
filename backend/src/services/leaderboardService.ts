import { pool } from '../db/pool';

export interface LeaderboardEntry {
  rank: number;
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  streak_current: number;
}

interface UserRow {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  streak_current: number;
}

function rank(rows: UserRow[]): LeaderboardEntry[] {
  return rows.map((row, i) => ({ rank: i + 1, ...row }));
}

// Caller + accepted friends, sorted by level DESC, xp DESC. Including the caller
// is what makes the leaderboard usable: otherwise you can't see your own rank.
export async function listFriendsLeaderboard(userId: string): Promise<LeaderboardEntry[]> {
  const { rows } = await pool.query<UserRow>(
    `SELECT id, display_name, username, avatar_url, level, xp, streak_current
       FROM users
      WHERE id = $1
         OR id IN (SELECT friend_id FROM friends WHERE user_id = $1)
      ORDER BY level DESC, xp DESC, display_name ASC
      LIMIT 50`,
    [userId],
  );
  return rank(rows);
}

// Global leaderboard is filtered to visibility = 'public'. PRODUCT.md principle:
// "private by default, social by invitation"; users have to opt in to public
// exposure before they appear here.
export async function listGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
  const { rows } = await pool.query<UserRow>(
    `SELECT id, display_name, username, avatar_url, level, xp, streak_current
       FROM users
      WHERE visibility = 'public'
      ORDER BY level DESC, xp DESC, display_name ASC
      LIMIT 100`,
  );
  return rank(rows);
}
