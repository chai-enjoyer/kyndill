export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 72;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function getEmailValidationMessage(value: string): string | null {
  const email = normalizeEmail(value);
  if (!email) return 'Email is required.';
  if (email.length > EMAIL_MAX_LENGTH) return 'Email must be 254 characters or fewer.';
  if (/\s/.test(email)) return 'Email cannot contain spaces.';
  if (!EMAIL_PATTERN.test(email)) return "That email doesn't look right.";

  const [local, domain] = email.split('@');
  if (!local || !domain) return "That email doesn't look right.";
  if (local.length > 64) return 'Email username must be 64 characters or fewer.';
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return "That email doesn't look right.";
  }

  const labels = domain.split('.');
  if (labels.some((label) => !label || label.startsWith('-') || label.endsWith('-'))) {
    return "That email doesn't look right.";
  }
  if (labels.some((label) => !/^[a-z0-9-]+$/.test(label))) {
    return "That email doesn't look right.";
  }

  return null;
}

export function getPasswordRequirementResults(password: string): PasswordRequirement[] {
  return [
    {
      id: 'length',
      label: `${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters`,
      met: password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
    },
    {
      id: 'lowercase',
      label: 'One lowercase letter',
      met: /[a-z]/.test(password),
    },
    {
      id: 'uppercase',
      label: 'One uppercase letter',
      met: /[A-Z]/.test(password),
    },
    {
      id: 'number',
      label: 'One number',
      met: /[0-9]/.test(password),
    },
    {
      id: 'symbol',
      label: 'One symbol',
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];
}

export function getPasswordValidationMessage(password: string): string | null {
  const firstMissing = getPasswordRequirementResults(password).find((requirement) => !requirement.met);
  return firstMissing ? `Password needs: ${firstMissing.label.toLowerCase()}.` : null;
}
