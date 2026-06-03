import { AnimatedValue } from '../../ui/AnimatedValue';

interface MobileStatsRowProps {
  completed: number;
  total: number;
  streak: number;
  level: number;
}

/*
 * Three at-a-glance numbers below the pet strip. 64px row, equal columns.
 * Mono 20px values, 11px uppercase labels in Ash Muted. Hairline column
 * separators rendered via the ::before of every cell after the first.
 */
export function MobileStatsRow({ completed, total, streak, level }: MobileStatsRowProps) {
  return (
    <section className="m-stats-row" aria-label="Today at a glance">
      <div className="m-stats-row__cell">
        <span className="m-stats-row__value">
          <AnimatedValue value={`${completed}/${total}`} />
        </span>
        <span className="m-stats-row__label">Today</span>
      </div>
      <div className="m-stats-row__cell">
        <span className="m-stats-row__value">
          <AnimatedValue value={streak} />
        </span>
        <span className="m-stats-row__label">Streak</span>
      </div>
      <div className="m-stats-row__cell">
        <span className="m-stats-row__value">
          <AnimatedValue value={level} />
        </span>
        <span className="m-stats-row__label">Level</span>
      </div>
    </section>
  );
}
