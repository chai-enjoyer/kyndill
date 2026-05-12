interface CompletionRingProps {
  completed: number;
  total: number;
}

const SIZE = 96;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CompletionRing({ completed, total }: CompletionRingProps) {
  const safeTotal = Math.max(0, total);
  const safeCompleted = Math.min(Math.max(0, completed), safeTotal);
  const pct = safeTotal === 0 ? 0 : safeCompleted / safeTotal;
  const offset = CIRCUMFERENCE * (1 - pct);

  return (
    <div
      className="completion-ring"
      role="img"
      aria-label={
        safeTotal === 0
          ? 'No habits today'
          : `${safeCompleted} of ${safeTotal} habits completed today`
      }
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} aria-hidden="true">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="var(--color-border-subtle)"
          strokeWidth={STROKE}
          fill="none"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="var(--color-sage)"
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          className="completion-ring__bar"
        />
      </svg>
      <div className="completion-ring__center" aria-hidden="true">
        <span className="completion-ring__count">
          <span className="completion-ring__done">{safeCompleted}</span>
          <span className="completion-ring__sep">/</span>
          <span className="completion-ring__total">{safeTotal}</span>
        </span>
        <span className="completion-ring__label">today</span>
      </div>
    </div>
  );
}
