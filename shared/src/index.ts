export type UserId = string;
export type HabitId = string;

export interface User {
  id: UserId;
  email: string;
  displayName: string;
  createdAt: string;
}

export type HabitCadence = 'daily' | 'weekly';

export interface Habit {
  id: HabitId;
  ownerId: UserId;
  name: string;
  cadence: HabitCadence;
  createdAt: string;
  archivedAt: string | null;
}

export interface HabitCompletion {
  habitId: HabitId;
  completedOn: string;
}

export type PetMood = 'content' | 'sleepy' | 'tired' | 'waiting';

export interface PetState {
  ownerId: UserId;
  mood: PetMood;
  lastSeenAt: string;
}
