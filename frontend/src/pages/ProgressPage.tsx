import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { AnimatedValue } from '../components/common/AnimatedValue';
import { Button } from '../components/common/Button';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { CategoryPill } from '../components/dashboard/CategoryPill';
import { FlameIcon } from '../components/common/FlameIcon';
import { useProgress, type ProgressSummary } from '../hooks/useProgress';

export function ProgressPage() {
  const { summary, isLoading, error, refetch } = useProgress();

  if (isLoading) {
    return (
      <section className="page progress-page" aria-busy="true">
        <LoadingSkeleton width="100%" height={480} />
      </section>
    );
  }

  if (error || !summary) {
    return (
      <section className="page progress-page">
        <header className="page__header">
          <div>
            <p className="page__eyebrow">Insights</p>
            <h1>Progress</h1>
          </div>
        </header>
        <div className="friends-empty" role="alert">
          <p>{error ?? 'Could not load progress.'}</p>
          <Button variant="secondary" onClick={refetch}>Retry</Button>
        </div>
      </section>
    );
  }

  const weekCompleted = summary.weekly.reduce((sum, day) => sum + day.completed, 0);
  const weekTarget = summary.weekly.reduce((sum, day) => sum + day.target, 0);

  return (
    <section className="page progress-page">
      <header className="page__header">
        <div>
          <p className="page__eyebrow">Insights</p>
          <h1>Progress</h1>
        </div>
        <div className="progress-page__actions">
          <Button variant="secondary" onClick={refetch}>Refresh</Button>
          <Link to="/habits" className="btn btn--secondary">Manage habits</Link>
        </div>
      </header>

      <div className="progress-grid">
        <section className="progress-panel progress-panel--hero">
          <div className="progress-hero">
            <p className="progress-panel__eyebrow">7-day completion</p>
            <strong>
              <AnimatedValue value={`${summary.overview.weekly_completion_rate}%`} />
            </strong>
            <span className="text-muted">Average completion rate from real habit activity.</span>
            <dl className="progress-hero__meta">
              <div>
                <dt>Check-ins</dt>
                <dd>{weekCompleted}/{weekTarget}</dd>
              </div>
              <div>
                <dt>Active days</dt>
                <dd>{summary.overview.active_days}</dd>
              </div>
              <div>
                <dt>Reflections</dt>
                <dd>{summary.overview.recovery_reflections}</dd>
              </div>
            </dl>
          </div>
          <WeeklyChart summary={summary} />
        </section>

        <section className="progress-panel progress-panel--wide progress-panel--metrics">
          <div className="progress-panel__head">
            <h2>Behavioral indicators</h2>
            <p>Useful for evaluating engagement and adherence during testing.</p>
          </div>
          <div className="progress-stat-grid progress-stat-grid--four">
            <StatCard label="Habits" value={summary.overview.total_habits_created} detail={`${summary.overview.active_habits} active`} />
            <StatCard label="Check-ins" value={summary.overview.total_check_ins} detail={`${summary.overview.total_completed_days} completed days`} />
            <StatCard label="Active days" value={summary.overview.active_days} detail="Days with activity" />
            <StatCard label="Focus" value={formatMinutes(summary.overview.focus_minutes)} detail={`${summary.overview.focus_sessions} sessions`} />
          </div>
        </section>

        <section className="progress-panel">
          <h2>Streaks</h2>
          <div className="progress-streaks">
            <div>
              <span className="progress-streaks__icon" aria-hidden="true"><FlameIcon size={28} /></span>
              <span>Current</span>
              <strong><AnimatedValue value={summary.overview.current_streak} /></strong>
            </div>
            <div>
              <span className="progress-streaks__icon" aria-hidden="true"><FlameIcon size={28} /></span>
              <span>Longest</span>
              <strong><AnimatedValue value={summary.overview.longest_streak} /></strong>
            </div>
          </div>
        </section>

        <section className="progress-panel">
          <h2>Most consistent</h2>
          {summary.most_consistent_habit ? (
            <article className="progress-consistent">
              <div>
                <h3>{summary.most_consistent_habit.name}</h3>
                <CategoryPill category={summary.most_consistent_habit.category} />
              </div>
              <strong><AnimatedValue value={`${summary.most_consistent_habit.rate}%`} /></strong>
              <p className="text-muted">
                {summary.most_consistent_habit.completed_days} of {summary.most_consistent_habit.expected_days} expected days
              </p>
            </article>
          ) : (
            <div className="friends-empty">Complete a few habits to see consistency.</div>
          )}
        </section>

        <section className="progress-panel progress-panel--wide">
          <h2>Category activity</h2>
          <CategoryBreakdown summary={summary} />
        </section>

        <section className="progress-panel">
          <h2>Reflection loop</h2>
          <div className="progress-reflection">
            <strong><AnimatedValue value={summary.overview.feedback_entries} /></strong>
            <span>feedback entries</span>
            <p className="text-muted">
              {summary.overview.recovery_reflections} recovery reflections saved after missed habits.
            </p>
          </div>
        </section>

        <section className="progress-panel">
          <h2>Social signals</h2>
          <div className="progress-stat-grid progress-stat-grid--compact">
            <StatCard label="Friends" value={summary.social.friends} />
            <StatCard label="Gifts sent" value={summary.social.gifts_sent} />
            <StatCard label="Gifts received" value={summary.social.gifts_received} />
          </div>
        </section>
      </div>
    </section>
  );
}

function WeeklyChart({ summary }: { summary: ProgressSummary }) {
  return (
    <div className="progress-chart" role="list" aria-label="Weekly completion chart">
      {summary.weekly.map((day) => {
        const rate = Math.min(100, Math.max(0, day.rate ?? 0));
        const scheduled = day.rate !== null;
        const flameDuration = 2.8 - rate / 90;
        const flameStyle = {
          '--flame-scale': scheduled ? `${0.66 + rate / 155}` : '0.52',
          '--flame-opacity': scheduled ? `${0.42 + rate / 175}` : '0.22',
          '--flame-glow': scheduled ? `${0.14 + rate / 145}` : '0.04',
          '--flame-duration': `${flameDuration.toFixed(2)}s`,
          '--flame-inner-progress-duration': `${(flameDuration * 0.7).toFixed(2)}s`,
        } as CSSProperties;
        return (
          <div
            key={day.date}
            className={`progress-chart__day ${scheduled ? '' : 'progress-chart__day--rest'}`}
            role="listitem"
          >
            <div
              className="progress-chart__track"
              role="progressbar"
              aria-label={`${day.label} completion`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={rate}
              aria-valuetext={scheduled ? `${rate}% complete` : 'No habits scheduled'}
            >
              <span className="progress-chart__flame-stage" style={flameStyle}>
                <FlameIcon size={64} className="progress-chart__flame" />
              </span>
            </div>
            <strong>{day.rate === null ? '-' : `${day.rate}%`}</strong>
            <span>{day.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function CategoryBreakdown({ summary }: { summary: ProgressSummary }) {
  const max = Math.max(1, ...summary.category_breakdown.map((entry) => entry.check_ins));
  return (
    <div className="progress-category-list">
      {summary.category_breakdown.map((entry) => {
        const width = Math.round((entry.check_ins / max) * 100);
        return (
          <div key={entry.category} className="progress-category-row">
            <CategoryPill category={entry.category} />
            <div className="progress-category-row__track" aria-hidden="true">
              <span style={{ width: `${width}%` }} />
            </div>
            <strong><AnimatedValue value={entry.check_ins} /></strong>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <article className="progress-stat-card">
      <span>{label}</span>
      <strong><AnimatedValue value={value} /></strong>
      {detail && <small>{detail}</small>}
    </article>
  );
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}
