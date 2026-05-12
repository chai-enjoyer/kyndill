import { useEffect, useState, type CSSProperties, type TouchEvent } from 'react';
import { Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useAuthContext } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import { useSocketContext } from '../context/SocketContext';
import { useHabits, type CompleteResult } from '../hooks/useHabits';
import { usePet } from '../hooks/usePet';
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar';
import { HabitListItem } from '../components/dashboard/HabitListItem';
import { PetPanel } from '../components/dashboard/PetPanel';
import { LevelUpModal } from '../components/dashboard/LevelUpModal';
import { FeedModal } from '../components/dashboard/FeedModal';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';

export function DashboardPage() {
  const { user, mergeUser } = useAuthContext();
  const { showToast } = useToastContext();
  const { socket } = useSocketContext();
  const { habits, isLoading: habitsLoading, error: habitsError, complete, refetch: refetchHabits } = useHabits();
  const { pet, isLoading: petLoading, applyCompletion, refetch: refetchPet } = usePet();

  const [levelUp, setLevelUp] = useState<number | null>(null);
  const [feedOpen, setFeedOpen] = useState(false);
  const [pullStart, setPullStart] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!socket) return;
    const handler = (payload: {
      from_display_name?: string;
      habit_name?: string;
    }) => {
      const who = payload.from_display_name ?? 'A friend';
      const what = payload.habit_name ?? 'a habit';
      showToast(`${who} completed ${what}.`, 'info');
    };
    socket.on('habit_completed', handler);
    return () => {
      socket.off('habit_completed', handler);
    };
  }, [socket, showToast]);

  async function handleHabitComplete(habitId: string): Promise<CompleteResult | null> {
    try {
      const result = await complete(habitId);
      mergeUser({
        xp: (user?.xp ?? 0) + result.xp_earned,
        coins: (user?.coins ?? 0) + result.coins_earned,
        level: result.new_level,
        streak_current: result.new_streak,
        streak_longest: result.longest_streak,
      });
      applyCompletion({
        health: result.pet_health,
        total_habits_completed: result.pet_total_habits_completed,
        is_fainted: result.pet_is_fainted,
      });
      if (result.item_dropped) {
        showToast(`You found ${result.item_dropped.name}.`, 'success');
      }
      if (result.leveled_up) {
        setLevelUp(result.new_level);
      }
      return result;
    } catch (err) {
      showToast(extractMessage(err), 'error');
      return null;
    }
  }

  async function refreshDashboard() {
    setRefreshing(true);
    try {
      await Promise.all([refetchHabits(), refetchPet()]);
      showToast('Dashboard refreshed.', 'success');
    } catch (err) {
      showToast(extractMessage(err), 'error');
    } finally {
      setRefreshing(false);
      setPullDistance(0);
      setPullStart(null);
    }
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (window.scrollY > 0) return;
    setPullStart(event.touches[0]?.clientY ?? null);
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (pullStart === null || refreshing) return;
    const y = event.touches[0]?.clientY ?? pullStart;
    setPullDistance(Math.min(96, Math.max(0, y - pullStart)));
  }

  function handleTouchEnd() {
    if (pullDistance > 70 && !refreshing) {
      void refreshDashboard();
      return;
    }
    setPullDistance(0);
    setPullStart(null);
  }

  const completed = habits.filter((h) => h.completed_today).length;
  const total = habits.length;
  const firstName = user?.display_name?.split(' ')[0] ?? '';
  const now = new Date();
  const greeting = getGreeting(now.getHours());
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className={`dashboard ${pullDistance > 0 || refreshing ? 'dashboard--pulling' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ '--pull-distance': `${pullDistance}px` } as CSSProperties}
    >
      <div className="pull-refresh" aria-live="polite">
        {refreshing ? 'Refreshing...' : pullDistance > 70 ? 'Release to refresh' : 'Pull to refresh'}
      </div>
      <DashboardSidebar
        pet={pet}
        completed={completed}
        total={total}
        streak={user?.streak_current ?? 0}
        isLoading={petLoading}
      />

      <section className="dashboard__main">
        <header className="dashboard__header">
          <p className="dashboard__date">{dateLabel}</p>
          <h1 className="dashboard__greeting">
            {greeting}
            {firstName && `, ${firstName}`}.
          </h1>
        </header>

        {habitsError ? (
          <ErrorState message={habitsError} onRetry={refreshDashboard} />
        ) : habitsLoading ? (
          <HabitsSkeleton />
        ) : total === 0 ? (
          <EmptyHabits />
        ) : (
          <ul className="dashboard__habits" role="list">
            {habits.map((habit) => (
              <HabitListItem key={habit.id} habit={habit} onComplete={handleHabitComplete} />
            ))}
          </ul>
        )}
      </section>

      <aside className="dashboard__pet-panel" aria-label="Your companion">
        {petLoading ? (
          <PetPanelSkeleton />
        ) : pet ? (
          <PetPanel pet={pet} userStreak={user?.streak_current ?? 0} onOpenFeed={() => setFeedOpen(true)} />
        ) : null}
      </aside>

      {levelUp !== null && <LevelUpModal newLevel={levelUp} onClose={() => setLevelUp(null)} />}
      {feedOpen && <FeedModal onClose={() => setFeedOpen(false)} onFed={refetchPet} />}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="dashboard__empty dashboard__empty--error" role="alert">
      <p>{message}</p>
      <button type="button" className="btn btn--secondary" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

function getGreeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function HabitsSkeleton() {
  return (
    <ul className="dashboard__habits" role="list" aria-busy="true" aria-live="polite">
      {[0, 1, 2].map((i) => (
        <li key={i} className="habit-item habit-item--skeleton">
          <LoadingSkeleton width={24} height={24} rounded />
          <LoadingSkeleton width="45%" height={18} />
          <LoadingSkeleton width={60} height={18} />
        </li>
      ))}
    </ul>
  );
}

function PetPanelSkeleton() {
  return (
    <div className="pet-panel pet-panel--skeleton" aria-busy="true">
      <LoadingSkeleton width={240} height={240} />
      <LoadingSkeleton width="60%" height={20} />
      <LoadingSkeleton width="100%" height={120} />
    </div>
  );
}

function EmptyHabits() {
  return (
    <div className="dashboard__empty">
      <p>Nothing on today's list yet.</p>
      <Link to="/habits" className="btn btn--secondary">
        Add a habit
      </Link>
    </div>
  );
}

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { message?: string; code?: string } } | undefined;
    if (data?.error?.code === 'ALREADY_COMPLETED') return 'That one is already done for today.';
    return data?.error?.message ?? 'Something did not save. Try again.';
  }
  return 'Something did not save. Try again.';
}
