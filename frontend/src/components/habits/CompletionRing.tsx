interface CompletionRingProps {
  completed: number;
  total: number;
}

/*
 * Half-gauge ("today's habits") for the desktop sidebar. The full circle
 * version felt small inside the sidebar's empty column; the gauge fills
 * the available width and reads as one centered piece of information
 * with the count tucked under the arc. Mobile uses the StatsRow instead
 * so this component is desktop-only in practice.
 */

const VIEW_W = 220;
const VIEW_H = 130;
const STROKE = 14;
const RADIUS = 92;
const CX = VIEW_W / 2;
const CY = 112; // baseline of the semicircle, leaves room for stroke + label
const ARC_LENGTH = Math.PI * RADIUS; // semicircle length

export function CompletionRing({ completed, total }: CompletionRingProps) {
  const safeTotal = Math.max(0, total);
  const safeCompleted = Math.min(Math.max(0, completed), safeTotal);
  const pct = safeTotal === 0 ? 0 : safeCompleted / safeTotal;
  const offset = ARC_LENGTH * (1 - pct);

  const arc = `M ${CX - RADIUS} ${CY} A ${RADIUS} ${RADIUS} 0 0 1 ${CX + RADIUS} ${CY}`;

  return (
    <div
      className="completion-gauge"
      role="img"
      aria-label={
        safeTotal === 0
          ? 'No habits today'
          : `${safeCompleted} of ${safeTotal} habits completed today`
      }
    >
      <svg
        className="completion-gauge__svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        width="100%"
        aria-hidden="true"
      >
        <path
          d={arc}
          stroke="var(--color-border-subtle)"
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={arc}
          stroke="var(--color-sage)"
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={ARC_LENGTH}
          strokeDashoffset={offset}
          className="completion-gauge__bar"
        />
      </svg>
      <div className="completion-gauge__readout" aria-hidden="true">
        <span className="completion-gauge__count">
          <span className="completion-gauge__done">{safeCompleted}</span>
          <span className="completion-gauge__sep">/</span>
          <span className="completion-gauge__total">{safeTotal}</span>
        </span>
        <span className="completion-gauge__label">done today</span>
      </div>
    </div>
  );
}
