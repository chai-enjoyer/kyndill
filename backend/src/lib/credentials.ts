export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 72;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function getEmailValidationMessage(value: string): string | null {
  const email = normalizeEmail(value);
  if (!email) return 'Email is required';
  if (email.length > EMAIL_MAX_LENGTH) return 'Email must be 254 characters or fewer';
  if (/\s/.test(email)) return 'Email cannot contain spaces';
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address';

  const [local, domain] = email.split('@');
  if (!local || !domain) return 'Enter a valid email address';
  if (local.length > 64) return 'Email username must be 64 characters or fewer';
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return 'Enter a valid email address';
  }

  const labels = domain.split('.');
  if (labels.some((label) => !label || label.startsWith('-') || label.endsWith('-'))) {
    return 'Enter a valid email address';
  }
  if (labels.some((label) => !/^[a-z0-9-]+$/.test(label))) return 'Enter a valid email address';

  return null;
}

export function getPasswordValidationMessages(password: string): string[] {
  const messages: string[] = [];
  if (password.length < PASSWORD_MIN_LENGTH) {
    messages.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    messages.push(`Password must be ${PASSWORD_MAX_LENGTH} characters or fewer`);
  }
  if (!/[a-z]/.test(password)) messages.push('Password needs a lowercase letter');
  if (!/[A-Z]/.test(password)) messages.push('Password needs an uppercase letter');
  if (!/[0-9]/.test(password)) messages.push('Password needs a number');
  if (!/[^A-Za-z0-9]/.test(password)) messages.push('Password needs a symbol');
  return messages;
}

export function getPasswordValidationMessage(password: string): string | null {
  return getPasswordValidationMessages(password)[0] ?? null;
}
