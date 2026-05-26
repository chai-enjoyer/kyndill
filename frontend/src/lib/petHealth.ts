// Mirror of backend petService.derivePetHealth so the UI can show exactly what
// contributes to the current health value. Keep both sides in sync.

export interface CareStats {
  happiness: number;
  hunger: number;
  energy: number;
  cleanliness: number;
}

export interface HealthBreakdown {
  health: number;
  careAverage: number;
  streakScore: number;
  consistencyBonus: number;
  weights: { care: number; streak: number; bonusMax: number };
}

export function deriveHealthBreakdown(currentStreak: number, stats: CareStats): HealthBreakdown {
  const safeStreak = Math.max(0, Math.floor(currentStreak));
  const careAverage = (stats.happiness + stats.hunger + stats.energy + stats.cleanliness) / 4;
  const streakScore = Math.min(100, safeStreak * 12);
  const consistencyBonus = Math.min(12, safeStreak * 2);
  const health = Math.round(
    Math.min(100, Math.max(0, careAverage * 0.55 + streakScore * 0.35 + consistencyBonus)),
  );
  return {
    health,
    careAverage: Math.round(careAverage),
    streakScore: Math.round(streakScore),
    consistencyBonus,
    weights: { care: 0.55, streak: 0.35, bonusMax: 12 },
  };
}
