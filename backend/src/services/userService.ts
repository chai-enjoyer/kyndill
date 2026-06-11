import { pool } from '../db/pool';
import { comparePassword, hashPassword } from './authService';
import { HttpError } from '../middleware/errorHandler';
import { applyPassiveDecay, derivePetHealth, type PetSpecies } from './petService';
import { getPasswordValidationMessage } from '../lib/credentials';

export interface UserSearchResult {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  level: number;
}

export interface ProfileDto {
  id: string;
  email: string;
  display_name: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  visibility: 'public' | 'friends' | 'private';
  level: number;
  xp: number;
  coins: number;
  streak_current: number;
  streak_longest: number;
  total_habits: number;
  total_focus_minutes: number;
  auth_provider: 'email' | 'google';
  notification_prefs: NotificationPrefs;
  research_consent: boolean;
  share_text_consent: boolean;
  reminder_hour: number | null;
  reminder_timezone: string;
}

export interface NotificationPrefs {
  friendRequests: boolean;
  gifts: boolean;
  focusReminders: boolean;
  dailyReminder?: boolean;
}

export interface PublicFriendProfile {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  visibility: 'public' | 'friends' | 'private';
  level: number;
  streak_current: number | null;
  total_habits_completed: number | null;
  pet: {
    species: PetSpecies;
    name: string;
    health: number;
    happiness: number;
    hunger: number;
    energy: number;
    cleanliness: number;
    total_habits_completed: number;
    is_fainted: boolean;
  } | null;
}

export async function searchUsers(userId: string, query: string): Promise<UserSearchResult[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const { rows } = await pool.query<UserSearchResult>(
    `SELECT id, display_name, username, avatar_url, level
       FROM users
      WHERE id <> $1
        AND LOWER(username) LIKE $2
      ORDER BY username ASC
      LIMIT 10`,
    [userId, `${q}%`],
  );
  return rows;
}

// Default suggestions for the Add Friend modal - public profiles only, with
// people the caller is already connected to (or has a pending request with)
// filtered out. Sorted by level so familiar/active users surface first.
export async function discoverPublicUsers(userId: string): Promise<UserSearchResult[]> {
  const { rows } = await pool.query<UserSearchResult>(
    `SELECT u.id, u.display_name, u.username, u.avatar_url, u.level
       FROM users u
      WHERE u.id <> $1
        AND u.visibility = 'public'
        AND NOT EXISTS (
          SELECT 1 FROM friends f
           WHERE (f.user_id = $1 AND f.friend_id = u.id)
              OR (f.user_id = u.id AND f.friend_id = $1)
        )
        AND NOT EXISTS (
          SELECT 1 FROM friend_requests r
           WHERE r.status = 'pending'
             AND ((r.from_user_id = $1 AND r.to_user_id = u.id)
                  OR (r.from_user_id = u.id AND r.to_user_id = $1))
        )
      ORDER BY u.level DESC, u.created_at DESC
      LIMIT 12`,
    [userId],
  );
  return rows;
}

export async function getProfile(userId: string): Promise<ProfileDto> {
  const { rows } = await pool.query<ProfileDto>(
    `SELECT u.id, u.email, u.display_name, u.username, u.bio, u.avatar_url,
            u.visibility, u.level, u.xp, u.coins, u.streak_current, u.streak_longest,
            CASE WHEN u.oauth_provider = 'google' THEN 'google' ELSE 'email' END AS auth_provider,
            u.notification_prefs,
            u.research_consent,
            u.share_text_consent,
            u.reminder_hour,
            u.reminder_timezone,
            (SELECT COUNT(*)::int FROM habits h WHERE h.user_id = u.id) AS total_habits,
            (SELECT COALESCE(SUM(duration_minutes), 0)::int FROM focus_sessions fs WHERE fs.user_id = u.id) AS total_focus_minutes
       FROM users u
      WHERE u.id = $1`,
    [userId],
  );
  if (rows.length === 0) throw new HttpError(404, 'USER_NOT_FOUND', 'User does not exist');
  return rows[0];
}

export async function updateProfile(
  userId: string,
  input: {
    display_name?: string;
    username?: string;
    bio?: string | null;
    visibility?: 'public' | 'friends' | 'private';
    avatar_url?: string | null;
    notification_prefs?: NotificationPrefs;
    research_consent?: boolean;
    share_text_consent?: boolean;
    reminder_hour?: number | null;
    reminder_timezone?: string;
  },
): Promise<ProfileDto> {
  const sets: string[] = [];
  const values: unknown[] = [];
  let i = 1;

  if (input.display_name !== undefined) {
    sets.push(`display_name = $${i++}`);
    values.push(input.display_name.trim());
  }
  if (input.username !== undefined) {
    sets.push(`username = $${i++}`);
    values.push(input.username.trim().toLowerCase());
  }
  if (input.bio !== undefined) {
    sets.push(`bio = $${i++}`);
    values.push(input.bio?.trim() ? input.bio.trim() : null);
  }
  if (input.visibility !== undefined) {
    sets.push(`visibility = $${i++}`);
    values.push(input.visibility);
  }
  if (input.avatar_url !== undefined) {
    sets.push(`avatar_url = $${i++}`);
    values.push(input.avatar_url);
  }
  if (input.notification_prefs !== undefined) {
    sets.push(`notification_prefs = $${i++}::jsonb`);
    values.push(JSON.stringify(input.notification_prefs));
  }
  if (input.research_consent !== undefined) {
    sets.push(`research_consent = $${i++}`);
    values.push(input.research_consent);
  }
  // Text sharing implicitly turns off when the user opts out of research at
  // all - there is no scenario in which "no research data" + "share my text"
  // makes sense, and forgetting this would silently strand stale consent.
  // Resolve to a single value first: opting out of research forces it false,
  // otherwise honor the explicit flag. Assigning the column twice in one
  // UPDATE (e.g. opt-out sends both flags false) is a Postgres error.
  const shareTextConsent =
    input.research_consent === false ? false : input.share_text_consent;
  if (shareTextConsent !== undefined) {
    sets.push(`share_text_consent = $${i++}`);
    values.push(shareTextConsent);
  }
  if (input.reminder_hour !== undefined) {
    sets.push(`reminder_hour = $${i++}`);
    values.push(input.reminder_hour);
  }
  if (input.reminder_timezone !== undefined) {
    sets.push(`reminder_timezone = $${i++}`);
    values.push(input.reminder_timezone);
  }

  if (sets.length > 0) {
    values.push(userId);
    try {
      await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${i}`, values);
    } catch (err) {
      if (typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505') {
        throw new HttpError(409, 'USERNAME_TAKEN', 'That username is already taken');
      }
      throw err;
    }
  }

  return getProfile(userId);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const { rows } = await pool.query<{ password_hash: string | null }>(
    `SELECT password_hash FROM users WHERE id = $1`,
    [userId],
  );
  if (rows.length === 0) throw new HttpError(404, 'USER_NOT_FOUND', 'User does not exist');
  if (!rows[0].password_hash) {
    throw new HttpError(400, 'OAUTH_ACCOUNT', 'Password changes are only available for email accounts');
  }
  const ok = await comparePassword(currentPassword, rows[0].password_hash);
  if (!ok) throw new HttpError(401, 'INVALID_PASSWORD', 'Current password is incorrect');
  const passwordIssue = getPasswordValidationMessage(newPassword);
  if (passwordIssue) throw new HttpError(400, 'WEAK_PASSWORD', passwordIssue);
  const reused = await comparePassword(newPassword, rows[0].password_hash);
  if (reused) throw new HttpError(400, 'PASSWORD_REUSED', 'Choose a password different from your current one');
  const next = await hashPassword(newPassword);
  await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [next, userId]);
}

export async function deleteAccount(userId: string): Promise<void> {
  await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
}

export async function getFriendProfile(userId: string, friendId: string): Promise<PublicFriendProfile> {
  const { rows: friendship } = await pool.query(
    `SELECT 1 FROM friends WHERE user_id = $1 AND friend_id = $2`,
    [userId, friendId],
  );
  if (friendship.length === 0) {
    throw new HttpError(404, 'NOT_FRIENDS', 'Friend profile is not available');
  }
  await applyPassiveDecay(friendId);

  const { rows } = await pool.query<{
    id: string;
    display_name: string;
    username: string;
    avatar_url: string | null;
    visibility: 'public' | 'friends' | 'private';
    level: number;
    streak_current: number;
    species: PetSpecies;
    pet_name: string;
    health: number;
    happiness: number;
    hunger: number;
    energy: number;
    cleanliness: number;
    is_fainted: boolean;
    total_habits_completed: number;
  }>(
    `SELECT u.id, u.display_name, u.username, u.avatar_url, u.visibility,
            u.level, u.streak_current,
            p.species, p.name AS pet_name, p.health, p.happiness, p.hunger, p.energy,
            p.cleanliness, p.is_fainted, p.total_habits_completed
       FROM users u
       LEFT JOIN pets p ON p.user_id = u.id
      WHERE u.id = $1`,
    [friendId],
  );
  if (rows.length === 0) throw new HttpError(404, 'USER_NOT_FOUND', 'User does not exist');

  const row = rows[0];
  const canSeeStats = row.visibility === 'public' || row.visibility === 'friends';
  return {
    id: row.id,
    display_name: row.display_name,
    username: row.username,
    avatar_url: row.avatar_url,
    visibility: row.visibility,
    level: row.level,
    streak_current: canSeeStats ? row.streak_current : null,
    total_habits_completed: canSeeStats ? row.total_habits_completed : null,
    pet: row.species
      ? {
          species: row.species,
          name: row.pet_name,
          health: derivePetHealth(row.streak_current, row),
          happiness: row.happiness,
          hunger: row.hunger,
          energy: row.energy,
          cleanliness: row.cleanliness,
          total_habits_completed: row.total_habits_completed,
          is_fainted: row.is_fainted,
        }
      : null,
  };
}
