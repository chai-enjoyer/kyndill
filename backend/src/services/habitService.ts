import { query } from '../lib/db'
import { AppError } from '../middleware/errorHandler'
import type { CreateHabitInput, UpdateHabitInput } from '../types'

// TODO: query habits WHERE user_id = userId AND is_active = TRUE ORDER BY sort_order
export async function listHabits(_userId: string): Promise<unknown[]> {
  throw new AppError(501, 'Not implemented')
}

// TODO: query habit by id, verify ownership
export async function getHabit(_userId: string, _habitId: string): Promise<unknown> {
  throw new AppError(501, 'Not implemented')
}

// TODO: insert habit row, return created habit
export async function createHabit(_userId: string, _input: CreateHabitInput): Promise<unknown> {
  throw new AppError(501, 'Not implemented')
}

// TODO: update habit by id, verify ownership
export async function updateHabit(
  _userId: string,
  _habitId: string,
  _input: UpdateHabitInput,
): Promise<unknown> {
  throw new AppError(501, 'Not implemented')
}

// TODO: set is_active = FALSE (soft delete)
export async function archiveHabit(_userId: string, _habitId: string): Promise<void> {
  throw new AppError(501, 'Not implemented')
}

// TODO: insert habit_completion row (ON CONFLICT DO NOTHING),
//       increment pets.total_habits_completed,
//       call rewardService.grant, call petService.updateMoodAfterCompletion
export async function completeHabit(
  _userId: string,
  _habitId: string,
  _completedOn: string,
): Promise<unknown> {
  throw new AppError(501, 'Not implemented')
}

// TODO: delete habit_completion for (habit_id, user_id, completed_on)
export async function undoCompletion(
  _userId: string,
  _habitId: string,
  _completedOn: string,
): Promise<void> {
  throw new AppError(501, 'Not implemented')
}

// TODO: bulk update sort_order values from [{id, sortOrder}] array
export async function reorderHabits(
  _userId: string,
  _order: Array<{ id: string; sortOrder: number }>,
): Promise<void> {
  throw new AppError(501, 'Not implemented')
}

export { query }
