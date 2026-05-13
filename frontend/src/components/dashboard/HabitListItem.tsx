import { useEffect, useState } from 'react';
import type { HabitWithStatus, CompleteResult } from '../../hooks/useHabits';
import { AnimatedValue } from '../common/AnimatedValue';
import { FlameIcon } from '../common/FlameIcon';
import { HabitCheckbox } from './HabitCheckbox';
import { CategoryPill } from './CategoryPill';
import { Confetti } from './Confetti';

interface HabitListItemProps {
  habit: HabitWithStatus;
  onComplete: (habitId: string) => Promise<CompleteResult | null>;
}

export function HabitListItem({ habit, onComplete }: HabitListItemProps) {
  const [submitting, setSubmitting] = useState(false);
  const [burst, setBurst] = useState(false);
  const targetCount = Math.max(1, habit.today_target_count || habit.target_count || 1);
  const completedCount = Math.min(targetCount, habit.completed_count);
  const isRepeating = targetCount > 1;
  const progress = Math.round((completedCount / targetCount) * 100);

  useEffect(() => {
    if (!burst) return;
    const t = window.setTimeout(() => setBurst(false), 900);
    return () => window.clearTimeout(t);
  }, [burst]);

  async function handleComplete() {
    if (habit.completed_today || submitting) return;
    setSubmitting(true);
    const willFinish = completedCount + 1 >= targetCount;
    setBurst(willFinish);
    const result = await onComplete(habit.id);
    setSubmitting(false);
    if (!result) {
      // Failure: hide the burst early.
      setBurst(false);
    }
  }

  return (
    <li className={`habit-item ${habit.completed_today ? 'habit-item--done' : ''} ${burst ? 'habit-item--burst' : ''}`}>
      <span className="habit-item__checkbox">
        <HabitCheckbox
          checked={habit.completed_today}
          disabled={habit.completed_today || submitting}
          onClick={handleComplete}
          ariaLabel={
            isRepeating
              ? `Log ${habit.name}, ${completedCount} of ${targetCount} done today`
              : `Mark ${habit.name} complete`
          }
        />
        {burst && <Confetti />}
      </span>

      <div className="habit-item__body">
        <span className="habit-item__title-row">
          <span className="habit-item__name">{habit.name}</span>
          <CategoryPill category={habit.category} />
        </span>
        {isRepeating && (
          <span className="habit-item__repeat" aria-label={`${completedCount} of ${targetCount} done today`}>
            <span className="habit-item__repeat-track">
              <span style={{ width: `${progress}%` }} />
            </span>
            <span className="habit-item__repeat-count">
              <AnimatedValue value={`${completedCount}/${targetCount}`} />
            </span>
          </span>
        )}
      </div>

      <span className="habit-item__streak" title={`${habit.current_streak} day streak`}>
        <span className="habit-item__streak-icon" aria-hidden="true">
          <FlameIcon size={15} />
        </span>
        <AnimatedValue value={habit.current_streak} className="habit-item__streak-value" />
        <span className="habit-item__streak-label text-muted">
          {habit.current_streak === 1 ? 'day' : 'days'}
        </span>
      </span>
    </li>
  );
}
