import { describe, expect, it } from 'vitest';
import { derivePetHealth } from '../src/services/petService';

describe('pet health derivation', () => {
  it('combines streak momentum with care stats', () => {
    const health = derivePetHealth(3, {
      happiness: 80,
      hunger: 70,
      energy: 65,
      cleanliness: 75,
    });

    expect(health).toBeGreaterThan(55);
    expect(health).toBeLessThan(100);
  });

  it('drops sharply when care stats are neglected', () => {
    expect(
      derivePetHealth(0, {
        happiness: 0,
        hunger: 0,
        energy: 0,
        cleanliness: 0,
      }),
    ).toBe(0);
  });

  it('caps strong streak and care at 100', () => {
    expect(
      derivePetHealth(30, {
        happiness: 100,
        hunger: 100,
        energy: 100,
        cleanliness: 100,
      }),
    ).toBe(100);
  });
});
