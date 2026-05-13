import { describe, expect, it } from 'vitest';
import {
  getEmailValidationMessage,
  getPasswordValidationMessages,
  normalizeEmail,
} from '../src/lib/credentials';

describe('credential validation', () => {
  it('normalizes email before persistence and login', () => {
    expect(normalizeEmail('  Iris@Example.COM  ')).toBe('iris@example.com');
  });

  it('accepts a well-formed email address', () => {
    expect(getEmailValidationMessage('iris@example.com')).toBeNull();
  });

  it('rejects malformed email addresses', () => {
    expect(getEmailValidationMessage('iris example.com')).toBe('Email cannot contain spaces');
    expect(getEmailValidationMessage('iris@example')).toBe('Enter a valid email address');
    expect(getEmailValidationMessage('.iris@example.com')).toBe('Enter a valid email address');
  });

  it('requires strong passwords', () => {
    expect(getPasswordValidationMessages('short')).toEqual([
      'Password must be at least 10 characters',
      'Password needs an uppercase letter',
      'Password needs a number',
      'Password needs a symbol',
    ]);
    expect(getPasswordValidationMessages('StrongPass1!')).toEqual([]);
  });
});
