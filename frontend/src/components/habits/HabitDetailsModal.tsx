import { Link } from 'react-router-dom';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CategoryPill } from './CategoryPill';
import { FlameIcon } from '../illustration/FlameIcon';
import type { HabitWithStatus } from '../../hooks/useHabits';

interface HabitDetailsModalProps {
  habit: HabitWithStatus;
  onClose: () => void;
}

/*
 * Desktop habit-row details. Opens when a user clicks anywhere on a
 * habit row except the checkbox. Surfaces what the row hides: full
 * description, schedule, today's count, current + longest streak.
 * "Edit" link routes to /habits (the management surface).
 */
export function HabitDetailsModal({ habit, onClose }: HabitDetailsModalProps) {
  const targetCount = Math.max(1, habit.today_target_count || habit.target_count || 1);
  const completedCount = Math.min(targetCount, habit.completed_count);
  const isRepeating = targetCount > 1;
  const frequency = formatFrequency(habit);

  return (
    <Modal isOpen onClose={onClose} title={habit.name}>
      <div className="habit-details">
        <div className="habit-details__head">
          <CategoryPill category={habit.category} />
          <span className="habit-details__freq">{frequency}</span>
        </div>

        {habit.description && (
          <p className="habit-details__description">{habit.description}</p>
        )}

        <dl className="habit-details__stats">
          <div>
            <dt>Today</dt>
            <dd>
              {isRepeating
                ? `${completedCount} of ${targetCount}`
                : habit.completed_today
                  ? 'Done'
                  : 'Not yet'}
            </dd>
          </div>
          <div>
            <dt>Current streak</dt>
            <dd className="habit-details__streak">
              <FlameIcon size={16} />
              {habit.current_streak} {habit.current_streak === 1 ? 'day' : 'days'}
            </dd>
          </div>
          {(habit.completion_start_time || habit.completion_end_time) && (
            <div>
              <dt>Window</dt>
              <dd>
                {habit.completion_start_time ?? '–'} to {habit.completion_end_time ?? '–'}
              </dd>
            </div>
          )}
        </dl>

        <footer className="habit-details__footer">
          <Link to="/habits" className="btn btn--secondary">Edit habit</Link>
          <Button variant="primary" onClick={onClose}>Close</Button>
        </footer>
      </div>
    </Modal>
  );
}

function formatFrequency(habit: HabitWithStatus): string {
  if (habit.frequency === 'daily') return 'Daily';
  if (habit.frequency === 'weekly') {
    const count = habit.days_of_week?.length ?? 0;
    return count > 0 ? `${count}× weekly` : 'Weekly';
  }
  return habit.frequency;
}
