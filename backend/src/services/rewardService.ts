import { query } from '../lib/db'
import { AppError } from '../middleware/errorHandler'

export interface GrantResult {
  xpEarned: number
  coinsEarned: number
  leveledUp: boolean
  newLevel: number
}

// TODO: calculate XP/coins based on habit category/streak multiplier,
//       UPDATE users SET xp = xp + $1, coins = coins + $2,
//       call checkLevelUp, return GrantResult
export async function grant(
  _userId: string,
  _baseXp: number,
  _baseCoins: number,
): Promise<GrantResult> {
  throw new AppError(501, 'Not implemented')
}

// TODO: derive level from XP using a curve (e.g. level = floor(sqrt(xp / 100)) + 1),
//       UPDATE users SET level = $1 if changed
export async function checkLevelUp(_userId: string): Promise<{ leveledUp: boolean; newLevel: number }> {
  throw new AppError(501, 'Not implemented')
}

export { query }
