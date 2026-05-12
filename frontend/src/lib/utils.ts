// PLACEHOLDER: Replace with actual item images when delivered.
// Each item gets a deterministic warm-neutral swatch keyed by a tiny string
// hash, plus the item's first letter on top. Good enough to read at a glance
// while the artist is still drawing the real assets.

const ITEM_SWATCHES = ['#C99E83', '#9F8B6E', '#8E6F58', '#A88D6B', '#B07F5D'];

export function getItemPlaceholder(itemName: string): string {
  const seed = hashString(itemName);
  const color = ITEM_SWATCHES[seed % ITEM_SWATCHES.length];
  const initial = (itemName[0] ?? '?').toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
  <rect width="80" height="80" rx="14" fill="${color}"/>
  <text x="40" y="52" font-family="ui-sans-serif, system-ui, sans-serif" font-size="32" font-weight="600" fill="rgba(255, 255, 255, 0.92)" text-anchor="middle">${escapeXml(initial)}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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
