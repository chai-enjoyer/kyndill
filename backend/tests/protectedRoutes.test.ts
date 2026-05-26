import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

describe('protected route boundaries', () => {
  const app = createApp();

  const protectedRoutes: Array<[Method, string]> = [
    ['get', '/api/habits'],
    ['get', '/api/pet'],
    ['get', '/api/shop'],
    ['get', '/api/inventory'],
    ['get', '/api/social/friends'],
    ['post', '/api/focus/complete'],
    ['get', '/api/user/profile'],
    ['get', '/api/leaderboard/friends'],
    ['get', '/api/notifications'],
    ['post', '/api/feedback'],
    ['get', '/api/progress/summary'],
    ['get', '/api/recovery/prompt'],
    ['get', '/api/journal/entries'],
  ];

  it.each(protectedRoutes)('rejects %s %s without a bearer token', async (method, path) => {
    const response = await request(app)[method](path).expect(401);

    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});
