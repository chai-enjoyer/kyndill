import { pool } from '../db/pool';

export interface CreateFeedbackInput {
  habit_id?: string;
  context: string;
  mood?: string;
  rating?: number;
  note?: string;
}

export async function create(userId: string, input: CreateFeedbackInput): Promise<void> {
  await pool.query(
    `INSERT INTO feedback_events (user_id, habit_id, context, mood, rating, note)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      userId,
      input.habit_id ?? null,
      input.context,
      input.mood ?? null,
      input.rating ?? null,
      input.note?.trim() ? input.note.trim() : null,
    ],
  );
}
