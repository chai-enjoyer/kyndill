import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { CategoryPill } from './CategoryPill';
import { extractMessage } from '../../hooks/useSocial';
import { trackEvent } from '../../lib/analytics';
import type { RecoveryPrompt, RecoveryReflectionInput } from '../../hooks/useRecovery';

interface RecoveryReflectionModalProps {
  prompt: RecoveryPrompt;
  onSave: (input: RecoveryReflectionInput) => Promise<void>;
  onClose: () => void;
  freezeCount?: number;
  currentStreak?: number;
}

const REASONS = [
  { value: 'too_busy', label: 'Too busy' },
  { value: 'low_energy', label: 'Low energy' },
  { value: 'forgot', label: 'Forgot' },
  { value: 'schedule_issue', label: 'Schedule shifted' },
  { value: 'unwell', label: 'Unwell' },
  { value: 'low_motivation', label: 'Low motivation' },
  { value: 'travel', label: 'Travel / away' },
  { value: 'other', label: 'Something else' },
] as const;

const ENCOURAGEMENTS = [
  'Missing one day does not undo what you have built.',
  'Resting and restarting is the rhythm — not a setback.',
  'Showing up here, right now, already counts.',
  'Consistency lives in the comeback, not the streak.',
];

export function RecoveryReflectionModal({
  prompt,
  onSave,
  onClose,
  freezeCount = 0,
  currentStreak = 0,
}: RecoveryReflectionModalProps) {
  const [reason, setReason] = useState('');
  const [habitId, setHabitId] = useState(prompt.missed_habits[0]?.id ?? '');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const missedDate = useMemo(
    () =>
      new Date(`${prompt.missed_on}T00:00:00`).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    [prompt.missed_on],
  );

  const encouragement = useMemo(() => {
    const seed = prompt.missed_on.charCodeAt(prompt.missed_on.length - 1);
    return ENCOURAGEMENTS[seed % ENCOURAGEMENTS.length];
  }, [prompt.missed_on]);

  const hasMultipleHabits = prompt.missed_habits.length > 1;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!reason || saving) return;
    await save({ mood: reason, note: note.trim() || undefined });
  }

  async function skip() {
    if (saving) return;
    await save({ skipped: true });
  }

  async function save(input: Partial<RecoveryReflectionInput>) {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        missed_on: prompt.missed_on,
        habit_id: habitId || undefined,
        ...input,
      });
      trackEvent(input.skipped ? 'recovery_skipped' : 'recovery_reflection_saved', {
        missed_on: prompt.missed_on,
        mood: input.mood ?? null,
        has_note: Boolean(input.note && input.note.trim()),
        missed_habit_id: habitId || null,
      });
      onClose();
    } catch (err) {
      setError(extractMessage(err, 'Could not save recovery reflection.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="No progress lost">
      <form className="recovery-reflection" onSubmit={submit}>
        <div className="recovery-reflection__intro">
          <p className="recovery-reflection__date">{missedDate}</p>
          <h3 className="recovery-reflection__lede">{encouragement}</h3>
          <p className="recovery-reflection__sub">
            A quick check-in turns a missed day into useful signal — no judgment, no
            penalty.
          </p>
        </div>

        {(freezeCount > 0 || currentStreak > 0) && (
          <div className="recovery-reflection__shield" role="status">
            <span className="recovery-reflection__shield-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18M5 7l14 10M19 7 5 17M7 5l2 4-4 1M17 5l-2 4 4 1M7 19l2-4-4-1M17 19l-2-4 4-1" />
              </svg>
            </span>
            <div>
              {freezeCount > 0 ? (
                <p>
                  Your streak is shielded — <strong>{freezeCount}</strong> freeze
                  {freezeCount === 1 ? '' : 's'} ready to absorb a missed day.
                </p>
              ) : currentStreak > 0 ? (
                <p>
                  You are on a <strong>{currentStreak}-day</strong> streak.
                  One reflection keeps the momentum going.
                </p>
              ) : null}
            </div>
          </div>
        )}

        {hasMultipleHabits && (
          <fieldset className="recovery-reflection__missed" aria-label="Missed habits">
            <legend>Which one is on your mind?</legend>
            {prompt.missed_habits.map((habit) => (
              <label key={habit.id} className={habitId === habit.id ? 'is-active' : ''}>
                <input
                  type="radio"
                  name="recovery-habit"
                  checked={habitId === habit.id}
                  onChange={() => setHabitId(habit.id)}
                />
                <span>
                  <strong>{habit.name}</strong>
                  <small>
                    {habit.completion_count}/{habit.target_count} done
                  </small>
                </span>
                <CategoryPill category={habit.category} />
              </label>
            ))}
          </fieldset>
        )}

        {!hasMultipleHabits && prompt.missed_habits[0] && (
          <div className="recovery-reflection__single" aria-label="Missed habit">
            <div>
              <strong>{prompt.missed_habits[0].name}</strong>
              <small>
                {prompt.missed_habits[0].completion_count}/
                {prompt.missed_habits[0].target_count} done
              </small>
            </div>
            <CategoryPill category={prompt.missed_habits[0].category} />
          </div>
        )}

        <fieldset className="recovery-reflection__reasons">
          <legend>What got in the way?</legend>
          <div className="reflection-chips" role="radiogroup" aria-label="Reason">
            {REASONS.map((item) => (
              <button
                key={item.value}
                type="button"
                role="radio"
                aria-checked={reason === item.value}
                className={`reflection-chip${reason === item.value ? ' is-active' : ''}`}
                onClick={() => setReason(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="recovery-reflection__note">
          <span>What would make tomorrow easier? (optional)</span>
          <textarea
            className="textarea"
            maxLength={1000}
            rows={3}
            placeholder="e.g. set out gear the night before, or shrink the habit to two minutes"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>

        {error && <p className="field__error" role="alert">{error}</p>}

        <div className="modal-actions recovery-reflection__actions">
          <Button variant="ghost" type="button" onClick={skip} disabled={saving}>
            Skip for now
          </Button>
          <Link
            className="btn btn--secondary"
            to="/habits"
            onClick={onClose}
          >
            Adjust habits
          </Link>
          <Button variant="primary" type="submit" disabled={!reason || saving}>
            {saving ? 'Saving…' : 'Save reflection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
