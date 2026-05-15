import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as notificationsService from '../services/notificationsService';
import * as pushService from '../services/pushService';

const router = Router();

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notifications = await notificationsService.listUnread(req.userId!);
    res.status(200).json({ notifications });
  } catch (err) {
    next(err);
  }
});

router.get('/push/public-key', (_req: Request, res: Response) => {
  res.status(200).json({
    enabled: pushService.isConfigured(),
    public_key: pushService.getPublicKey(),
  });
});

router.get('/push/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subscriptionCount = await pushService.countSubscriptions(req.userId!);
    res.status(200).json({
      enabled: pushService.isConfigured(),
      subscription_count: subscriptionCount,
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/push/subscribe',
  validate(pushSubscriptionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await pushService.saveSubscription(
        req.userId!,
        req.body,
        req.get('user-agent') ?? undefined,
      );
      res.status(201).json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/push/unsubscribe',
  validate(pushUnsubscribeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await pushService.deleteSubscription(req.userId!, req.body.endpoint);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

router.post('/push/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await pushService.sendPushToUser(
      req.userId!,
      {
        title: 'Kyndill notifications are ready',
        body: 'You will receive important habit, reward, and social updates here.',
        url: '/settings',
        tag: 'push_test',
      },
      'push_test',
    );
    res.status(202).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.put('/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await notificationsService.markAllRead(req.userId!);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export { router as notificationsRouter };
