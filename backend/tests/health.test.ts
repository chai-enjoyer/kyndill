import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

describe('health endpoint', () => {
  it('returns a stable readiness payload', async () => {
    const app = createApp();

    const response = await request(app).get('/health').expect(200);

    expect(response.body).toEqual({ status: 'ok' });
  });
});
