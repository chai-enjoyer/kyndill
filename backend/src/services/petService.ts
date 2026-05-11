import { query } from '../lib/db'
import { AppError } from '../middleware/errorHandler'
import { emitToUser } from '../socket/socketHandler'

// TODO: SELECT * FROM pets WHERE user_id = $1
export async function getPet(_userId: string): Promise<unknown> {
  throw new AppError(501, 'Not implemented')
}

// TODO: UPDATE pets SET name = $1 WHERE user_id = $2 AND id = $3
export async function updatePet(
  _userId: string,
  _input: { name?: string; species?: string },
): Promise<unknown> {
  throw new AppError(501, 'Not implemented')
}

// TODO: verify item is a consumable in user's inventory (quantity > 0),
//       apply effect_stat += effect_amount (clamp 0-100),
//       UPDATE inventory SET quantity = quantity - 1,
//       emit pet:updated via socket
export async function feedPet(_userId: string, _itemId: string): Promise<unknown> {
  throw new AppError(501, 'Not implemented')
}

// Called by cron: apply daily stat decay to all pets.
// TODO: batch UPDATE pets, set is_fainted = TRUE when health = 0
export async function applyDailyDecay(): Promise<void> {
  throw new AppError(501, 'Not implemented')
}

// Called after a habit completion: boost happiness and health slightly.
// TODO: UPDATE pets SET happiness = LEAST(100, happiness + 5), ...
export async function boostAfterCompletion(_userId: string): Promise<void> {
  throw new AppError(501, 'Not implemented')
}

// Helper used internally to push pet state to the client in real time.
export async function emitPetUpdate(userId: string, petData: unknown): Promise<void> {
  emitToUser(userId, 'pet:updated', petData)
}

export { query }
