import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as socialService from '../services/socialService';

const router = Router();

const requestSchema = z.object({ username: z.string().trim().min(1).max(40) });
const respondSchema = z.object({ action: z.enum(['accept', 'reject']) });
const giftSchema = z.object({
  friend_id: z.string().uuid(),
  item_id: z.string().uuid(),
  message: z.string().max(280).optional(),
});
const idParam = z.object({ id: z.string().uuid() });
const friendIdParam = z.object({ friend_id: z.string().uuid() });

router.get('/friends', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const friends = await socialService.listFriends(req.userId!);
    res.status(200).json({ friends });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/friends/request',
  validate(requestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await socialService.sendFriendRequest(req.userId!, req.body.username);
      res.status(201).json(request);
    } catch (err) {
      next(err);
    }
  },
);

router.get('/friends/requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await socialService.listFriendRequests(req.userId!);
    res.status(200).json({ requests });
  } catch (err) {
    next(err);
  }
});

router.get('/friends/requests/sent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await socialService.listSentFriendRequests(req.userId!);
    res.status(200).json({ requests });
  } catch (err) {
    next(err);
  }
});

router.put(
  '/friends/request/:id',
  validate(idParam, 'params'),
  validate(respondSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await socialService.respondToFriendRequest(
        req.userId!,
        req.params.id,
        req.body.action,
      );
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/friends/:friend_id',
  validate(friendIdParam, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await socialService.removeFriend(req.userId!, req.params.friend_id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/gifts/send',
  validate(giftSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await socialService.sendGift(
        req.userId!,
        req.body.friend_id,
        req.body.item_id,
        req.body.message,
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/gifts/:id/accept',
  validate(idParam, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await socialService.acceptGift(req.userId!, req.params.id);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },
);

router.get('/activity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const activity = await socialService.listActivity(req.userId!);
    res.status(200).json({ activity });
  } catch (err) {
    next(err);
  }
});

export { router as socialRouter };
