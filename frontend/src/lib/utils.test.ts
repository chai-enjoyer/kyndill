import { describe, expect, it } from 'vitest';
import { derivePetHealth, deriveStreakHealth, formatRelative, getItemPlaceholder, toDateString } from './utils';

describe('utility helpers', () => {
  it('generates a safe fallback image for unknown inventory items', () => {
    const angleImage = getItemPlaceholder('<mystery snack>');
    const ampersandImage = getItemPlaceholder('& mystery snack');

    expect(angleImage).toMatch(/^data:image\/svg\+xml;utf8,/);
    expect(decodeURIComponent(angleImage)).toContain('&lt;');
    expect(decodeURIComponent(ampersandImage)).toContain('&amp;');
  });

  it('formats relative timestamps for notification menus', () => {
    const now = new Date('2026-05-13T12:00:00.000Z');

    expect(formatRelative('2026-05-13T11:59:30.000Z', now)).toBe('just now');
    expect(formatRelative('2026-05-13T11:20:00.000Z', now)).toBe('40m ago');
    expect(formatRelative('2026-05-13T09:00:00.000Z', now)).toBe('3h ago');
  });

  it('converts dates to yyyy-mm-dd for API payloads', () => {
    expect(toDateString(new Date('2026-05-13T23:59:00.000Z'))).toBe('2026-05-13');
  });

  it('derives pet health from both care stats and streak momentum', () => {
    const caredFor = derivePetHealth(5, {
      happiness: 80,
      hunger: 80,
      energy: 80,
      cleanliness: 80,
    });
    const neglected = derivePetHealth(5, {
      happiness: 10,
      hunger: 10,
      energy: 10,
      cleanliness: 10,
    });

    expect(caredFor).toBeGreaterThan(neglected);
    expect(deriveStreakHealth(0)).toBe(0);
    expect(deriveStreakHealth(20)).toBe(100);
  });
});
