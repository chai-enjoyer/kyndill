import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import type { HabitWithStatus, CompleteResult } from '../../../hooks/useHabits';
import { AnimatedValue } from '../../ui/AnimatedValue';
import { CategoryPill } from '../../habits/CategoryPill';
import { Confetti } from '../../ui/Confetti';

interface MobileHabitListProps {
  habits: HabitWithStatus[];
  onComplete: (habitId: string) => Promise<CompleteResult | null>;
}

/* How long the user must hold before a habit logs. Long enough that an
 * accidental tap doesn't fire, short enough that intentional completion
 * still feels snappy. */
const HOLD_DURATION_MS = 650;

export function MobileHabitList({ habits, onComplete }: MobileHabitListProps) {
  return (
    <ul className="m-habits" role="list">
      {habits.map((habit) => (
        <MobileHabitRow key={habit.id} habit={habit} onComplete={onComplete} />
      ))}
    </ul>
  );
}

function MobileHabitRow({
  habit,
  onComplete,
}: {
  habit: HabitWithStatus;
  onComplete: (habitId: string) => Promise<CompleteResult | null>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [burst, setBurst] = useState(false);
  const targetCount = Math.max(1, habit.today_target_count || habit.target_count || 1);
  const completedCount = Math.min(targetCount, habit.completed_count);
  const isRepeating = targetCount > 1;
  const disabled = habit.completed_today || submitting;

  useEffect(() => {
    if (!burst) return;
    const t = window.setTimeout(() => setBurst(false), 900);
    return () => window.clearTimeout(t);
  }, [burst]);

  async function fireComplete() {
    if (disabled) return;
    setSubmitting(true);
    const willFinish = completedCount + 1 >= targetCount;
    setBurst(willFinish);
    const result = await onComplete(habit.id);
    setSubmitting(false);
    if (!result) setBurst(false);
  }

  const { holding, bindings } = useHoldGesture(fireComplete, disabled);
  const ariaLabel = isRepeating
    ? `Hold to log ${habit.name}, ${completedCount} of ${targetCount} done today`
    : `Hold to mark ${habit.name} complete`;

  return (
    <li className={`m-habit ${habit.completed_today ? 'm-habit--done' : ''} ${burst ? 'm-habit--burst' : ''}`}>
      <button
        type="button"
        role={isRepeating ? 'button' : 'checkbox'}
        aria-checked={isRepeating ? undefined : habit.completed_today}
        aria-label={ariaLabel}
        disabled={disabled}
        className={`m-habit__row ${holding ? 'is-holding' : ''}`}
        style={{ '--hold-duration': `${HOLD_DURATION_MS}ms` } as CSSProperties}
        {...bindings}
      >
        {/* Background fill that grows left→right while the user holds. Sits
            behind row content (z-index 0); content is z-index 1. */}
        <span className="m-habit__row-fill" aria-hidden="true" />

        <span className="m-habit__control" aria-hidden="true">
          {isRepeating ? (
            <RingVisual completed={completedCount} target={targetCount} holding={holding} />
          ) : (
            <CheckVisual checked={habit.completed_today} holding={holding} />
          )}
          {burst && <Confetti />}
        </span>

        <span className="m-habit__body">
          <span className="m-habit__name">{habit.name}</span>
          <CategoryPill category={habit.category} />
        </span>

        <span className="m-habit__streak" title={`${habit.current_streak} day streak`}>
          <AnimatedValue value={habit.current_streak} className="m-habit__streak-value" />
          <span className="m-habit__streak-unit" aria-hidden="true">d</span>
          <span className="visually-hidden">day streak</span>
        </span>
      </button>
    </li>
  );
}

/*
 * Hold gesture hook. Press -> ramp; reach HOLD_DURATION_MS -> fire.
 * Release / leave / cancel -> reset. Keyboard activation (Enter/Space)
 * still fires immediately so screen-reader and keyboard users aren't
 * forced into a long-press they can't perform.
 *
 * Pointer capture is critical: it keeps subsequent pointer events
 * (pointermove, pointerup, pointerleave) targeted at the original
 * button even if the finger drifts off the visual bounds. Without
 * capture, a slight finger wiggle past a 28px control would cancel.
 */
function useHoldGesture(onFire: () => void, disabled: boolean) {
  const [holding, setHolding] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const activePointerRef = useRef<number | null>(null);

  const clearHold = () => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    activePointerRef.current = null;
    setHolding(false);
  };

  useEffect(() => () => clearHold(), []);

  useEffect(() => {
    if (disabled) clearHold();
  }, [disabled]);

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled || event.button !== 0) return;
    // Capture so subsequent pointer events stay on this button even if
    // the finger drifts past the row bounds during the hold.
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* old browsers */ }
    activePointerRef.current = event.pointerId;
    setHolding(true);
    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      activePointerRef.current = null;
      setHolding(false);
      onFire();
    }, HOLD_DURATION_MS);
  };

  const onPointerEnd = (event: PointerEvent<HTMLButtonElement>) => {
    if (activePointerRef.current !== null && event.pointerId !== activePointerRef.current) return;
    clearHold();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      clearHold();
      onFire();
    }
  };

  return {
    holding,
    bindings: {
      onPointerDown,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
      onKeyDown,
    },
  };
}

function CheckVisual({ checked, holding }: { checked: boolean; holding: boolean }) {
  return (
    <span className={`m-habit__check ${checked ? 'is-checked' : ''} ${holding ? 'is-holding' : ''}`}>
      <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
        <rect x="1.5" y="1.5" width="25" height="25" rx="7" className="m-habit__check-box" />
        <path d="M8 14.5 L12 18.2 L20 9.8" fill="none" className="m-habit__check-tick" />
      </svg>
    </span>
  );
}

function RingVisual({
  completed,
  target,
  holding,
}: {
  completed: number;
  target: number;
  holding: boolean;
}) {
  const radius = 11.5;
  const circumference = 2 * Math.PI * radius;
  const safeTarget = Math.max(1, target);
  const safeCompleted = Math.min(safeTarget, Math.max(0, completed));
  const restingOffset = circumference * (1 - safeCompleted / safeTarget);
  // While holding, sweep fully clockwise so the user sees commitment.
  // On release without firing, the resting offset returns instantly.
  const offset = holding ? 0 : restingOffset;
  const isDone = safeCompleted >= safeTarget;

  return (
    <span className={`m-habit__ring ${isDone ? 'is-done' : ''} ${holding ? 'is-holding' : ''}`}>
      <svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true">
        <circle cx="14" cy="14" r={radius} className="m-habit__ring-track" fill="none" strokeWidth="2" />
        <circle
          cx="14"
          cy="14"
          r={radius}
          className="m-habit__ring-fill"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 14 14)"
        />
      </svg>
      <span className="m-habit__ring-count" aria-hidden="true">
        {safeCompleted}/{safeTarget}
      </span>
    </span>
  );
}
