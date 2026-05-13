import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { generateToken } from '../src/services/authService';

const USER_ID = '00000000-0000-4000-8000-000000000001';

describe('authenticated API validation', () => {
  const app = createApp();
  const token = generateToken(USER_ID);
  const auth = { Authorization: `Bearer ${token}` };

  const invalidCases: Array<{
    name: string;
    method: 'post' | 'put' | 'patch' | 'delete';
    path: string;
    body: unknown;
  }> = [
    {
      name: 'weekly habits require selected days',
      method: 'post',
      path: '/api/habits',
      body: { name: 'Read', category: 'Learning', frequency: 'weekly' },
    },
    {
      name: 'habit target count is bounded',
      method: 'post',
      path: '/api/habits',
      body: { name: 'Water', category: 'Wellness', frequency: 'daily', target_count: 25 },
    },
    {
      name: 'pet species must be supported',
      method: 'post',
      path: '/api/pet/initialize',
      body: { species: 'dragon', name: 'Nova' },
    },
    {
      name: 'pet names cannot be blank',
      method: 'patch',
      path: '/api/pet/name',
      body: { name: '   ' },
    },
    {
      name: 'shop purchases require a uuid item',
      method: 'post',
      path: '/api/shop/purchase',
      body: { item_id: 'not-a-uuid' },
    },
    {
      name: 'focus sessions require positive duration',
      method: 'post',
      path: '/api/focus/complete',
      body: { duration_minutes: 0 },
    },
    {
      name: 'focus ratings are 1 to 5',
      method: 'post',
      path: '/api/focus/complete',
      body: { duration_minutes: 25, rating: 6 },
    },
    {
      name: 'friend request username is required',
      method: 'post',
      path: '/api/social/friends/request',
      body: { username: '   ' },
    },
    {
      name: 'gifts require valid friend and item ids',
      method: 'post',
      path: '/api/social/gifts/send',
      body: { friend_id: 'friend', item_id: 'item' },
    },
    {
      name: 'profile usernames stay URL-safe',
      method: 'patch',
      path: '/api/user/profile',
      body: { username: 'bad username' },
    },
    {
      name: 'feedback ratings are 1 to 5',
      method: 'post',
      path: '/api/feedback',
      body: { context: 'general_feedback', rating: 6 },
    },
    {
      name: 'recovery reflections require an ISO date',
      method: 'post',
      path: '/api/recovery/reflection',
      body: { missed_on: 'yesterday', skipped: true },
    },
    {
      name: 'account deletion requires explicit confirmation',
      method: 'delete',
      path: '/api/user/account',
      body: { confirmation: 'delete' },
    },
  ];

  it.each(invalidCases)('$name', async ({ method, path, body }) => {
    const response = await request(app)[method](path).set(auth).send(body).expect(400);

    expect(response.body.error.code).toBe('VALIDATION_FAILED');
    expect(response.body.error.issues.length).toBeGreaterThan(0);
  });
});
