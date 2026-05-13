import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { InfoTip } from './InfoTip';

describe('InfoTip', () => {
  it('links the info control to its explanatory tooltip for assistive tech', () => {
    render(<InfoTip label="Health info" text="Health combines care stats and streak momentum." />);

    const button = screen.getByRole('button', { name: 'Health info' });
    const tooltip = screen.getByRole('tooltip');

    expect(button).toHaveAttribute('aria-describedby', tooltip.id);
    expect(tooltip).toHaveTextContent('Health combines care stats and streak momentum.');
  });
});
