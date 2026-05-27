import { Link } from 'react-router-dom';
import { AnimatedValue } from '../../common/AnimatedValue';

interface MobileXpRowProps {
  level: number;
  xp: number;
}

/*
 * User-level XP progress strip for the mobile dashboard. Lives directly
 * under the stats row so the user sees their level *and* how close they
 * are to the next one in a single glance. Tap navigates to /progress for
 * the full insights view.
 */
export function MobileXpRow({ level, xp }: MobileXpRowProps) {
  const { current, needed, progress } = getXpProgress(xp, level);
  return (
    <Link to="/progress" className="m-xp-row" aria-label={`Level ${level}, ${current} of ${needed} XP toward next level`}>
      <span className="m-xp-row__head">
        <span className="m-xp-row__label">
          Level <AnimatedValue value={level} />
        </span>
        <span className="m-xp-row__value">
          <AnimatedValue value={current.toLocaleString()} />
          <span className="m-xp-row__value-sep"> / </span>
          {needed.toLocaleString()} XP
        </span>
      </span>
      <span
        className="m-xp-row__bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <span style={{ width: `${progress}%` }} />
      </span>
    </Link>
  );
}

/* Same formula the desktop dashboard uses (quadratic curve). Kept inline
 * because lifting it into a shared util would touch two files for a
 * one-call helper. */
function getXpProgress(totalXp: number, level: number) {
  const safeLevel = Math.max(1, Math.floor(level));
  const currentLevelFloor = safeLevel <= 1 ? 0 : 100 * (safeLevel - 1) * (safeLevel - 1);
  const nextLevelXp = 100 * safeLevel * safeLevel;
  const needed = Math.max(1, nextLevelXp - currentLevelFloor);
  const current = Math.min(needed, Math.max(0, totalXp - currentLevelFloor));
  return { current, needed, progress: Math.round((current / needed) * 100) };
}
