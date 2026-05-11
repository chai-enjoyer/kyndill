import { query } from '../lib/db'
import { AppError } from '../middleware/errorHandler'
import type { RecordFocusInput } from '../types'

// TODO: SELECT * FROM focus_sessions WHERE user_id = $1 ORDER BY completed_at DESC LIMIT $2
export async function listSessions(_userId: string, _limit = 20): Promise<unknown[]> {
  throw new AppError(501, 'Not implemented')
}

// TODO: INSERT INTO focus_sessions, optionally grant XP for completed sessions
export async function recordSession(_userId: string, _input: RecordFocusInput): Promise<unknown> {
  throw new AppError(501, 'Not implemented')
}

export { query }
