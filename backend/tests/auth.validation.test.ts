import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

describe('auth route validation', () => {
  const app = createApp();

  it('rejects weak registration credentials before hitting persistence', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'not-an-email',
        password: 'short',
        password_confirmation: 'different',
        display_name: 'I',
      })
      .expect(400);

    expect(response.body.error.code).toBe('VALIDATION_FAILED');
    const messages = response.body.error.issues.map((issue: { message: string }) => issue.message);
    expect(messages).toContain('Enter a valid email address');
    expect(messages).toContain('Display name must be at least 2 characters');
    expect(messages).toContain('Passwords do not match');
  });
});
