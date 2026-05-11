// ─── Express augmentation ──────────────────────────────────────────────────
// Adds userId to Request so authenticate middleware can attach it once
// and downstream handlers can read it without casting.

declare global {
  namespace Express {
    interface Request {
      userId: string
    }
  }
}

// ─── JWT ───────────────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string
  iat: number
  exp: number
}

// ─── Pagination ────────────────────────────────────────────────────────────

export interface PaginationQuery {
  page?: number
  limit?: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// ─── Service input DTOs (filled in when routes are implemented) ────────────

export interface CreateHabitInput {
  name: string
  description?: string
  category: 'Health' | 'Productivity' | 'Social' | 'Learning' | 'Wellness'
  frequency: 'daily' | 'weekly'
  daysOfWeek?: number[]
  completionStartTime?: string
  completionEndTime?: string
}

export interface UpdateHabitInput extends Partial<CreateHabitInput> {
  isActive?: boolean
  sortOrder?: number
}

export interface UpdateProfileInput {
  displayName?: string
  bio?: string
  avatarUrl?: string
}

export interface RegisterInput {
  email: string
  password: string
  username: string
  displayName: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface FeedPetInput {
  itemId: string
}

export interface BuyItemInput {
  itemId: string
}

export interface EquipItemInput {
  itemId: string
  slot: 'hat' | 'accessory' | 'background'
}

export interface SendGiftInput {
  toUserId: string
  itemId: string
  message?: string
}

export interface FriendRequestInput {
  toUserId: string
}

export interface RecordFocusInput {
  durationMinutes: number
  rating?: number
}

// ─── Socket event payloads ─────────────────────────────────────────────────

export interface PetUpdatedPayload {
  petId: string
  health: number
  happiness: number
  hunger: number
  energy: number
  cleanliness: number
  stage: number
  isفainted: boolean
}

export interface NotificationPayload {
  id: string
  type: string
  content: string
  metadata: Record<string, unknown>
  createdAt: string
}
