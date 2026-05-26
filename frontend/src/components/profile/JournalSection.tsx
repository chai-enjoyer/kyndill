import { useMemo, useState } from 'react';
import { Button } from '../common/Button';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { useToastContext } from '../../context/ToastContext';
import { extractMessage } from '../../hooks/useSocial';
import { useJournal, type JournalEntry, type JournalEntryKind } from '../../hooks/useJournal';

// Diary-style view of the user's own reflections. Read + delete only; entries
// are immutable in spirit (editing past feelings is the wrong UX for evaluation
// data).

interface FilterOption {
  value: 'all' | JournalEntryKind;
  label: string;
}

const FILTERS: FilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'habit_feedback', label: 'Habit feelings' },
  { value: 'recovery_reflection', label: 'Recoveries' },
  { value: 'mood_ping', label: 'Weekly check-ins' },
];

const KIND_LABEL: Record<JournalEntryKind, string> = {
  habit_feedback: 'Habit feeling',
  recovery_reflection: 'Recovery reflection',
  recovery_skipped: 'Missed day',
  mood_ping: 'Weekly check-in',
};

const MOOD_LABEL: Record<string, string> = {
  energized: 'Energized',
  proud: 'Proud',
  calm: 'Calm',
  steady: 'Steady',
  foggy: 'Foggy',
  tough: 'Tough',
  drained: 'Drained',
  too_busy: 'Too busy',
  low_energy: 'Low energy',
  forgot: 'Forgot',
  schedule_issue: 'Schedule shifted',
  unwell: 'Unwell',
  low_motivation: 'Low motivation',
  travel: 'Travel / away',
  other: 'Something else',
};

const RATING_LABEL: Record<number, string> = {
  1: 'Heavy',
  2: 'Off-beat',
  3: 'Steady',
  4: 'Light',
  5: 'Bright',
};

export function JournalSection() {
  const { entries, isLoading, isLoadingMore, hasMore, error, loadMore, remove } = useJournal();
  const { showToast } = useToastContext();
  const [filter, setFilter] = useState<FilterOption['value']>('all');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return entries;
    if (filter === 'recovery_reflection') {
      return entries.filter(
        (e) => e.kind === 'recovery_reflection' || e.kind === 'recovery_skipped',
      );
    }
    return entries.filter((e) => e.kind === filter);
  }, [entries, filter]);

  async function handleDelete(entry: JournalEntry) {
    const ok = window.confirm('Delete this entry? This cannot be undone.');
    if (!ok) return;
    setPendingDeleteId(entry.id);
    try {
      await remove(entry);
      showToast('Entry deleted.', 'success');
    } catch (err) {
      showToast(extractMessage(err, 'Could not delete entry.'), 'error');
    } finally {
      setPendingDeleteId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="journal-section">
        <LoadingSkeleton width="100%" height={120} />
        <LoadingSkeleton width="100%" height={120} />
      </div>
    );
  }

  return (
    <div className="journal-section">
      <header className="journal-section__head">
        <div>
          <h2>Your reflections</h2>
          <p className="text-muted">
            Everything you've written or tagged — habit feelings, recovery notes, weekly
            check-ins. Only you can see this.
          </p>
        </div>
      </header>

      <div className="journal-filters" role="tablist" aria-label="Filter reflections">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={filter === option.value}
            className={`journal-filter${filter === option.value ? ' is-active' : ''}`}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && <p className="field__error" role="alert">{error}</p>}

      {filtered.length === 0 ? (
        <p className="journal-empty text-muted">
          {entries.length === 0
            ? "Nothing here yet. Reflections show up after you complete habits, recover from missed days, or send a weekly check-in."
            : 'No entries match this filter.'}
        </p>
      ) : (
        <ul className="journal-entries" role="list">
          {filtered.map((entry) => (
            <EntryCard
              key={`${entry.source}-${entry.id}`}
              entry={entry}
              isDeleting={pendingDeleteId === entry.id}
              onDelete={() => handleDelete(entry)}
            />
          ))}
        </ul>
      )}

      {hasMore && filtered.length > 0 && (
        <div className="journal-more">
          <Button variant="secondary" type="button" onClick={loadMore} disabled={isLoadingMore}>
            {isLoadingMore ? 'Loading…' : 'Load older'}
          </Button>
        </div>
      )}
    </div>
  );
}

interface EntryCardProps {
  entry: JournalEntry;
  isDeleting: boolean;
  onDelete: () => void;
}

function EntryCard({ entry, isDeleting, onDelete }: EntryCardProps) {
  const dateLabel = formatDate(entry.created_at);
  const meta = describeMeta(entry);
  const tag = readableMoodOrRating(entry);

  return (
    <li className={`journal-entry journal-entry--${entry.kind}`}>
      <div className="journal-entry__head">
        <div>
          <span className="journal-entry__kind">{KIND_LABEL[entry.kind]}</span>
          <time className="journal-entry__date">{dateLabel}</time>
          {meta && <span className="journal-entry__meta text-muted">{meta}</span>}
        </div>
        {tag && <span className="journal-entry__tag">{tag}</span>}
      </div>
      {entry.note ? (
        <p className="journal-entry__note">{entry.note}</p>
      ) : (
        <p className="journal-entry__note journal-entry__note--empty text-muted">No note</p>
      )}
      <div className="journal-entry__actions">
        <button
          type="button"
          className="journal-entry__delete"
          onClick={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </li>
  );
}

function describeMeta(entry: JournalEntry): string | null {
  if (entry.kind === 'mood_ping' && entry.week_of) {
    return `Week of ${formatShortDate(entry.week_of)}`;
  }
  if (entry.kind === 'recovery_reflection' || entry.kind === 'recovery_skipped') {
    return entry.missed_on ? `Missed ${formatShortDate(entry.missed_on)}` : null;
  }
  if (entry.kind === 'habit_feedback' && entry.habit) {
    return entry.habit.name;
  }
  return null;
}

function readableMoodOrRating(entry: JournalEntry): string | null {
  if (entry.mood) return MOOD_LABEL[entry.mood] ?? entry.mood;
  if (entry.rating != null) {
    const label = RATING_LABEL[entry.rating];
    return label ? `${entry.rating} · ${label}` : String(entry.rating);
  }
  return null;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatShortDate(value: string): string {
  // value may be ISO date (YYYY-MM-DD) or full ISO timestamp. Both parse fine
  // with the Date constructor when given the date-only string with a T-anchor.
  const iso = value.includes('T') ? value : `${value}T00:00:00`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
