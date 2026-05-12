type StatIcon = 'health' | 'happiness' | 'hunger' | 'energy' | 'cleanliness';

interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  icon: StatIcon;
  derived?: string;
}

const ICON_PATHS: Record<StatIcon, string> = {
  health: 'M12 21s-7-4.5-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-7 10-7 10z',
  happiness: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zM9 10.5v0M15 10.5v0M8.5 14.5a4 4 0 0 0 7 0',
  hunger: 'M7 4v8a3 3 0 0 0 3 3 3 3 0 0 0 0-6V4M17 4c-1 1-1 5 0 8 .8 1.6 3 1.6 3-1V4',
  energy: 'M13 2 4 14h6l-1 8 11-12h-7l0-8z',
  cleanliness: 'M12 3c-3 4-5 7-5 10a5 5 0 0 0 10 0c0-3-2-6-5-10z',
};

export function StatBar({ label, value, max = 100, icon, derived }: StatBarProps) {
  const safeValue = Math.min(max, Math.max(0, value));
  const pct = max === 0 ? 0 : (safeValue / max) * 100;
  const labelId = `stat-${icon}-label`;
  return (
    <div className="stat-bar" data-icon={icon}>
      <div className="stat-bar__head">
        <span className="stat-bar__icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={ICON_PATHS[icon]} />
          </svg>
        </span>
        <span className="stat-bar__label" id={labelId}>{label}</span>
        <span className="stat-bar__value">{Math.round(safeValue)}</span>
      </div>
      <div
        className="stat-bar__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(safeValue)}
        aria-labelledby={labelId}
      >
        <div className="stat-bar__fill" style={{ width: `${pct}%` }} />
      </div>
      {derived && <span className="stat-bar__derived text-muted">{derived}</span>}
    </div>
  );
}
