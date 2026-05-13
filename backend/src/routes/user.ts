import { Router, type Request, type Response, type NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as userService from '../services/userService';
import { getPasswordValidationMessages } from '../lib/credentials';

const router = Router();

const notificationPrefsSchema = z.object({
  friendRequests: z.boolean(),
  gifts: z.boolean(),
  focusReminders: z.boolean(),
});

const avatarUrlSchema = z
  .string()
  .max(750_000)
  .refine(
    (value) =>
      /^data:image\/(png|jpe?g|webp);base64,[a-zA-Z0-9+/=]+$/.test(value) ||
      z.string().url().safeParse(value).success,
    'Avatar must be an image upload or URL',
  );

const profileSchema = z.object({
  display_name: z.string().trim().min(2).max(60).optional(),
  username: z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  bio: z.string().max(280).nullable().optional(),
  visibility: z.enum(['public', 'friends', 'private']).optional(),
  avatar_url: avatarUrlSchema.nullable().optional(),
  notification_prefs: notificationPrefsSchema.optional(),
  research_consent: z.boolean().optional(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().superRefine((password, ctx) => {
    for (const message of getPasswordValidationMessages(password)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
      });
    }
  }),
});

const deleteSchema = z.object({ confirmation: z.literal('DELETE') });
const friendIdParam = z.object({ id: z.string().uuid() });

router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : '';
    const users = await userService.searchUsers(req.userId!, q);
    res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
});

router.get('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await userService.getProfile(req.userId!);
    res.status(200).json(profile);
  } catch (err) {
    next(err);
  }
});

router.patch(
  '/profile',
  validate(profileSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await userService.updateProfile(req.userId!, req.body);
      res.status(200).json(profile);
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  '/change-password',
  validate(passwordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await userService.changePassword(
        req.userId!,
        req.body.current_password,
        req.body.new_password,
      );
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  '/account',
  validate(deleteSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await userService.deleteAccount(req.userId!);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  '/friends/:id/profile',
  validate(friendIdParam, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await userService.getFriendProfile(req.userId!, req.params.id);
      res.status(200).json(profile);
    } catch (err) {
      next(err);
    }
  },
);

// Catch-all by username; must remain last so /profile resolves first.
router.get('/:username', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await userService.searchUsers(req.userId!, req.params.username);
    const user = users.find((item) => item.username === req.params.username);
    if (!user) {
      res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: 'User does not exist' } });
      return;
    }
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
});

export { router as userRouter };
