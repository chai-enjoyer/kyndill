import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PasswordRequirements } from './PasswordRequirements';

describe('PasswordRequirements', () => {
  it('renders each registration password rule', () => {
    render(<PasswordRequirements id="password-help" password="StrongPass1!" />);

    expect(screen.getByRole('list', { name: /password requirements/i })).toBeInTheDocument();
    expect(screen.getByText('10 to 72 characters')).toBeInTheDocument();
    expect(screen.getByText('One lowercase letter')).toBeInTheDocument();
    expect(screen.getByText('One uppercase letter')).toBeInTheDocument();
    expect(screen.getByText('One number')).toBeInTheDocument();
    expect(screen.getByText('One symbol')).toBeInTheDocument();
  });
});
