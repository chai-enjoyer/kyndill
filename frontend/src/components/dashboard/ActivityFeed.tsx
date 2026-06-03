import { useState } from 'react';
import { Button } from '../ui/Button';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { Modal } from '../ui/Modal';
import type { ActivityEntry } from '../../hooks/useActivityFeed';

export function ActivityFeed({
  activity,
  isLoading,
  error,
  onRetry,
}: {
  activity: ActivityEntry[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  const [selected, setSelected] = useState<ActivityEntry | null>(null);

  return (
    <section className="activity-feed" aria-labelledby="activity-feed-heading">
      <header className="activity-feed__header">
        <div>
          <h2 id="activity-feed-heading">Activity</h2>
          <p>Recent progress from you and friends.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onRetry} disabled={isLoading}>
          Refresh
        </Button>
      </header>

      {error ? (
        <div className="activity-feed__empty activity-feed__empty--error" role="alert">
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <div className="activity-feed__list" aria-busy="true" aria-live="polite">
          {[0, 1, 2].map((item) => (
            <div key={item} className="activity-feed__item">
              <LoadingSkeleton width={36} height={36} rounded />
              <div className="activity-feed__copy">
                <LoadingSkeleton width="75%" height={14} />
                <LoadingSkeleton width="45%" height={12} />
              </div>
            </div>
          ))}
        </div>
      ) : activity.length === 0 ? (
        <div className="activity-feed__empty">
          <p>Complete a habit, buy an item, or add a friend to start the feed.</p>
        </div>
      ) : (
        <ol className="activity-feed__list" role="list">
          {activity.map((entry) => {
            const message = getActivityMessage(entry);
            return (
              <li
                key={entry.id}
                className={`activity-feed__item ${entry.is_current_user ? 'activity-feed__item--self' : ''}`}
              >
                <button type="button" className="activity-feed__button" onClick={() => setSelected(entry)}>
                  <span className={`activity-feed__icon activity-feed__icon--${iconTone(entry.type)}`} aria-hidden="true">
                    <ActivityIcon type={entry.type} />
                  </span>
                  <div className="activity-feed__copy">
                    <strong>{message.title}</strong>
                    <span>{message.detail}</span>
                  </div>
                  <time dateTime={entry.created_at}>{relativeTime(entry.created_at)}</time>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {selected && (
        <ActivityDetailsModal entry={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}

function ActivityDetailsModal({ entry, onClose }: { entry: ActivityEntry; onClose: () => void }) {
  const message = getActivityMessage(entry);
  const details = getActivityDetails(entry);
  return (
    <Modal isOpen onClose={onClose} title="Activity details">
      <div className="activity-details">
        <div className="activity-details__summary">
          <span className={`activity-feed__icon activity-feed__icon--${iconTone(entry.type)}`} aria-hidden="true">
            <ActivityIcon type={entry.type} />
          </span>
          <div>
            <strong>{message.title}</strong>
            <span>{message.detail || entry.type.split('_').join(' ')}</span>
          </div>
        </div>
        <dl>
          <div><dt>Who</dt><dd>{entry.is_current_user ? 'You' : entry.user_display_name}</dd></div>
          <div><dt>Username</dt><dd>@{entry.user_username}</dd></div>
          <div><dt>When</dt><dd>{formatAbsolute(entry.created_at)}</dd></div>
          <div><dt>Type</dt><dd>{entry.type.split('_').join(' ')}</dd></div>
          {details.map((detail) => (
            <div key={detail.label}>
              <dt>{detail.label}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Modal>
  );
}

function getActivityMessage(entry: ActivityEntry): { title: string; detail: string } {
  const actor = entry.is_current_user ? 'You' : entry.user_display_name;
  const metadata = entry.metadata;

  switch (entry.type) {
    case 'habit_completed': {
      const habitName = textValue(metadata.habit_name);
      const habitLabel = entry.is_current_user && habitName ? habitName : 'a habit';
      const coins = numberValue(metadata.coins_earned);
      const xp = numberValue(metadata.xp_earned);
      const streak = numberValue(metadata.new_streak);
      const completedCount = numberValue(metadata.completed_count);
      const targetCount = numberValue(metadata.target_count);
      const itemDrop = objectValue(metadata.item_dropped);
      const itemName = itemDrop ? textValue(itemDrop.item_name) : '';
      return {
        title: `${actor} completed ${habitLabel}`,
        detail: [
          targetCount !== null && targetCount > 1 && completedCount !== null ? `${completedCount}/${targetCount}` : '',
          coins !== null ? `${coins} coins` : '',
          xp !== null ? `${xp} XP` : '',
          streak !== null ? `${streak} day streak` : '',
          itemName ? `found ${itemName}` : '',
        ].filter(Boolean).join(', '),
      };
    }
    case 'purchase': {
      const itemName = textValue(metadata.item_name) || 'an item';
      const price = numberValue(metadata.price);
      return {
        title: `${actor} bought ${itemName}`,
        detail: price !== null ? `${price} coins spent` : 'Shop purchase',
      };
    }
    case 'friendship': {
      const friend = textValue(metadata.friend_display_name) || 'a friend';
      return {
        title: `${actor} and ${friend} became friends`,
        detail: 'New friend connection',
      };
    }
    case 'level_up': {
      const level = numberValue(metadata.new_level);
      return {
        title: `${actor} reached Level ${level ?? '?'}`,
        detail: 'Level up',
      };
    }
    case 'gift_sent': {
      const itemName = textValue(metadata.item_name) || 'a gift';
      return {
        title: `${actor} sent ${itemName}`,
        detail: 'Gift sent',
      };
    }
    default:
      return {
        title: `${actor} did something new`,
        detail: entry.type.split('_').join(' '),
      };
  }
}

function getActivityDetails(entry: ActivityEntry): Array<{ label: string; value: string }> {
  const metadata = entry.metadata;
  const details: Array<{ label: string; value: string }> = [];
  const add = (label: string, value: string | number | null) => {
    if (value === null || value === '') return;
    details.push({ label, value: String(value) });
  };

  switch (entry.type) {
    case 'habit_completed':
      add('Habit', entry.is_current_user ? textValue(metadata.habit_name) : 'Private habit');
      add('Category', textValue(metadata.category));
      add('Completed', completionLabel(metadata.completed_count, metadata.target_count));
      add('Coins', numberValue(metadata.coins_earned));
      add('XP', numberValue(metadata.xp_earned));
      add('Streak', numberValue(metadata.new_streak));
      break;
    case 'purchase':
      add('Item', textValue(metadata.item_name));
      add('Price', numberValue(metadata.price));
      break;
    case 'friendship':
      add('Friend', textValue(metadata.friend_display_name));
      add('Friend username', textValue(metadata.friend_username));
      break;
    case 'level_up':
      add('New level', numberValue(metadata.new_level));
      add('Total XP', numberValue(metadata.xp));
      break;
    case 'gift_sent':
      add('Item', textValue(metadata.item_name));
      break;
    default:
      break;
  }

  const itemDrop = objectValue(metadata.item_dropped);
  if (itemDrop) {
    add('Found item', textValue(itemDrop.item_name));
    add('Rarity', textValue(itemDrop.rarity));
  }
  return details;
}

function completionLabel(completed: unknown, target: unknown): string | null {
  const completedCount = numberValue(completed);
  const targetCount = numberValue(target);
  if (completedCount === null || targetCount === null) return null;
  return targetCount > 1 ? `${completedCount}/${targetCount}` : 'Done';
}

function ActivityIcon({ type }: { type: string }) {
  const path = iconPath(type);
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

function iconPath(type: string): string {
  switch (type) {
    case 'habit_completed':
      return 'M5 12.5l4 4L19 6.5';
    case 'purchase':
      return 'M6 8h12l-1 11H7L6 8zM9 8a3 3 0 0 1 6 0';
    case 'friendship':
      return 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a5 5 0 0 1 10 0M11 20a5 5 0 0 1 10 0';
    case 'level_up':
      return 'M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3z';
    case 'gift_sent':
      return 'M20 12v8H4v-8M3 8h18v4H3zM12 8v12M12 8H8.5A2.5 2.5 0 1 1 12 5.5M12 8h3.5A2.5 2.5 0 1 0 12 5.5';
    default:
      return 'M12 5v14M5 12h14';
  }
}

function iconTone(type: string): string {
  switch (type) {
    case 'habit_completed':
      return 'sage';
    case 'purchase':
      return 'honey';
    case 'friendship':
      return 'info';
    case 'level_up':
      return 'clay';
    default:
      return 'neutral';
  }
}

function textValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function objectValue(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function relativeTime(value: string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return '';
  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const divisions: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['week', 604_800],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  for (const [unit, amount] of divisions) {
    if (Math.abs(seconds) >= amount || unit === 'minute') {
      return formatter.format(Math.round(seconds / amount), unit);
    }
  }
  return 'now';
}

function formatAbsolute(value: string): string {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return '';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
}
