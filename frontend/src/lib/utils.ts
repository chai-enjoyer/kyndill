import apple from '../assets/sprites/apple.svg';
import bow from '../assets/sprites/bow.png';
import bowTie from '../assets/sprites/bow_tie.png';
import bread from '../assets/sprites/bread.svg';
import carrot from '../assets/sprites/carrot.svg';
import coffee from '../assets/sprites/coffee.svg';
import cylinderHat from '../assets/sprites/cylinder_hat.png';
import fish from '../assets/sprites/fish.svg';
import medal from '../assets/sprites/medal.png';
import snowflake from '../assets/sprites/snowflake.svg';
import soap from '../assets/sprites/soap.svg';
import sunglasses from '../assets/sprites/sunglasses.png';
import toyBall from '../assets/sprites/toy_ball.svg';
import water from '../assets/sprites/water.svg';
import wizardHat from '../assets/sprites/wizard_hat.png';

const ITEM_SWATCHES = ['#C99E83', '#9F8B6E', '#8E6F58', '#A88D6B', '#B07F5D'];

export function getItemPlaceholder(itemName: string): string {
  const asset = getSpriteItemAsset(itemName);
  if (asset) return asset;

  const seed = hashString(itemName);
  const color = ITEM_SWATCHES[seed % ITEM_SWATCHES.length];
  const initial = (itemName[0] ?? '?').toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <rect width="80" height="80" rx="14" fill="${color}"/>
  <text x="40" y="52" font-family="ui-sans-serif, system-ui, sans-serif" font-size="32" font-weight="600" fill="rgba(255, 255, 255, 0.92)" text-anchor="middle">${escapeXml(initial)}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function getSpriteItemAsset(itemName: string): string | null {
  const name = itemName.toLowerCase();
  if (name === 'apple') return apple;
  if (name === 'bread') return bread;
  if (name === 'fish') return fish;
  if (name === 'carrot') return carrot;
  if (name === 'water') return water;
  if (name === 'coffee') return coffee;
  if (name === 'soap') return soap;
  if (name.includes('freeze')) return snowflake;
  if (name === 'toy ball') return toyBall;
  if (name === 'bow') return bow;
  if (name.includes('bow tie')) return bowTie;
  if (name.includes('sunglasses')) return sunglasses;
  if (name.includes('wizard hat')) return wizardHat;
  if (name.includes('cylinder hat')) return cylinderHat;
  if (name.includes('badge')) return medal;
  if (name.includes('medal')) return medal;
  return null;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================================
// Date helpers
// ============================================================

export function formatRelative(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function toDateString(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n);
}

export interface PetCareStats {
  happiness: number;
  hunger: number;
  energy: number;
  cleanliness: number;
}

export function derivePetHealth(streak: number, stats: PetCareStats): number {
  const safeStreak = Math.max(0, Math.floor(streak));
  const careAverage = (stats.happiness + stats.hunger + stats.energy + stats.cleanliness) / 4;
  const streakScore = Math.min(100, safeStreak * 12);
  const consistencyBonus = Math.min(12, safeStreak * 2);
  return Math.round(Math.min(100, Math.max(0, careAverage * 0.55 + streakScore * 0.35 + consistencyBonus)));
}

export function deriveStreakHealth(streak: number, stats?: PetCareStats): number {
  if (stats) return derivePetHealth(streak, stats);
  const safeStreak = Math.max(0, Math.floor(streak));
  return Math.min(100, safeStreak * 12);
}

// ============================================================
// Theme helpers
// ============================================================

export type Theme = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'kyndill_theme';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  const value = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return 'system';
}

export function applyTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);

  const prefersDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const root = document.documentElement;
  root.classList.toggle('dark', prefersDark);

  if (theme === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
}
