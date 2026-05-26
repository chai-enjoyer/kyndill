import express, { type Express, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { authRouter } from './routes/auth';
import { habitsRouter } from './routes/habits';
import { petRouter } from './routes/pet';
import { shopRouter } from './routes/shop';
import { inventoryRouter } from './routes/inventory';
import { socialRouter } from './routes/social';
import { focusRouter } from './routes/focus';
import { userRouter } from './routes/user';
import { leaderboardRouter } from './routes/leaderboard';
import { notificationsRouter } from './routes/notifications';
import { feedbackRouter } from './routes/feedback';
import { progressRouter } from './routes/progress';
import { recoveryRouter } from './routes/recovery';
import { analyticsRouter } from './routes/analytics';
import { moodPingRouter } from './routes/moodPing';
import { onboardingRouter } from './routes/onboarding';
import { journalRouter } from './routes/journal';

import { requireAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // /api/auth manages its own per-route protection (register, login, google are public).
  app.use('/api/auth', authRouter);

  // Every other surface requires a valid JWT.
  app.use('/api/habits', requireAuth, habitsRouter);
  app.use('/api/pet', requireAuth, petRouter);
  app.use('/api/shop', requireAuth, shopRouter);
  app.use('/api/inventory', requireAuth, inventoryRouter);
  app.use('/api/social', requireAuth, socialRouter);
  app.use('/api/focus', requireAuth, focusRouter);
  app.use('/api/user', requireAuth, userRouter);
  app.use('/api/leaderboard', requireAuth, leaderboardRouter);
  app.use('/api/notifications', requireAuth, notificationsRouter);
  app.use('/api/feedback', requireAuth, feedbackRouter);
  app.use('/api/progress', requireAuth, progressRouter);
  app.use('/api/recovery', requireAuth, recoveryRouter);
  app.use('/api/analytics', requireAuth, analyticsRouter);
  app.use('/api/mood-pings', requireAuth, moodPingRouter);
  app.use('/api/onboarding', requireAuth, onboardingRouter);
  app.use('/api/journal', requireAuth, journalRouter);

  app.use(errorHandler);
  return app;
}
