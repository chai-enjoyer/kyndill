import { pool } from '../db/pool';

export interface OnboardingQuizAnswers {
  intents: string[];
  pace: string;
  times: string[];
  energy: string;
  blocker: string;
  age_band?: string;
  occupation?: string;
  student_level?: string;
  region?: string;
}

export async function saveQuiz(userId: string, answers: OnboardingQuizAnswers): Promise<void> {
  await pool.query(
    `INSERT INTO onboarding_quiz_responses (user_id, answers)
     VALUES ($1, $2::jsonb)
     ON CONFLICT (user_id)
     DO UPDATE SET answers = EXCLUDED.answers, updated_at = NOW()`,
    [userId, JSON.stringify(answers)],
  );
}

export async function getQuiz(userId: string): Promise<OnboardingQuizAnswers | null> {
  const { rows } = await pool.query<{ answers: OnboardingQuizAnswers }>(
    `SELECT answers FROM onboarding_quiz_responses WHERE user_id = $1`,
    [userId],
  );
  return rows[0]?.answers ?? null;
}
