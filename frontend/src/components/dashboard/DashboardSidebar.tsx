import { AnimatedValue } from '../ui/AnimatedValue';
import { FlameIcon } from '../illustration/FlameIcon';
import { ActivityFeed } from './ActivityFeed';
import { CompletionRing } from '../habits/CompletionRing';
import type { ActivityEntry } from '../../hooks/useActivityFeed';

interface DashboardSidebarProps {
  completed: number;
  total: number;
  streak: number;
  freezeCount: number;
  activity: ActivityEntry[];
  activityLoading: boolean;
  activityError: string | null;
  onActivityRetry: () => void;
}

export function DashboardSidebar({
  completed,
  total,
  streak,
  freezeCount,
  activity,
  activityLoading,
  activityError,
  onActivityRetry,
}: DashboardSidebarProps) {
  return (
    <aside className="dashboard__sidebar" aria-label="Today summary">
      <CompletionRing completed={completed} total={total} />

      <div className="dashboard__sidebar-streak">
        <span className="dashboard__sidebar-streak-icon" aria-hidden="true">
          <FlameIcon size={22} />
        </span>
        <AnimatedValue value={streak} className="dashboard__sidebar-streak-value" />
        <span className="dashboard__sidebar-streak-label text-muted">
          {streak === 1 ? 'day steady' : 'days steady'}
        </span>
      </div>

      <div className="dashboard__sidebar-freeze" aria-label={`${freezeCount} of 3 streak freezes available`}>
        <span className="dashboard__sidebar-freeze-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 3v18M5 7l14 10M19 7 5 17M7 5l2 4-4 1M17 5l-2 4 4 1M7 19l2-4-4-1M17 19l-2-4 4-1" />
          </svg>
        </span>
        <span className="dashboard__sidebar-freeze-copy">
          <strong>
            <AnimatedValue value={`${freezeCount}/3`} />
          </strong>
          <span className="text-muted">streak freezes</span>
        </span>
      </div>

      <ActivityFeed
        activity={activity}
        isLoading={activityLoading}
        error={activityError}
        onRetry={onActivityRetry}
      />
    </aside>
  );
}
