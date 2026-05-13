import { describe, expect, it } from 'vitest';
import {
  getEmailValidationMessage,
  getPasswordRequirementResults,
  getPasswordValidationMessage,
  normalizeEmail,
} from './credentials';

describe('frontend credential validation', () => {
  it('normalizes email for auth requests', () => {
    expect(normalizeEmail('  Iris@Example.COM  ')).toBe('iris@example.com');
  });

  it('shows friendly email validation messages', () => {
    expect(getEmailValidationMessage('')).toBe('Email is required.');
    expect(getEmailValidationMessage('iris@example.com')).toBeNull();
    expect(getEmailValidationMessage('iris@example')).toBe("That email doesn't look right.");
  });

  it('reports password requirements for the checklist', () => {
    const weak = getPasswordRequirementResults('short');
    expect(weak.filter((item) => item.met)).toHaveLength(1);
    expect(getPasswordValidationMessage('short')).toBe('Password needs: 10 to 72 characters.');

    const strong = getPasswordRequirementResults('StrongPass1!');
    expect(strong.every((item) => item.met)).toBe(true);
    expect(getPasswordValidationMessage('StrongPass1!')).toBeNull();
  });
});
