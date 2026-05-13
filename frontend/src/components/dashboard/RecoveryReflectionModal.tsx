import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { CategoryPill } from './CategoryPill';
import { extractMessage } from '../../hooks/useSocial';
import type { RecoveryPrompt, RecoveryReflectionInput } from '../../hooks/useRecovery';

interface RecoveryReflectionModalProps {
  prompt: RecoveryPrompt;
  onSave: (input: RecoveryReflectionInput) => Promise<void>;
  onClose: () => void;
}

const REASONS = [
  { value: 'too_busy', label: 'Too busy' },
  { value: 'low_energy', label: 'Low energy' },
  { value: 'forgot', label: 'Forgot' },
  { value: 'schedule_issue', label: 'Schedule issue' },
  { value: 'other', label: 'Other' },
] as const;

export function RecoveryReflectionModal({
  prompt,
  onSave,
  onClose,
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

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!reason || saving) return;
    await save({ mood: reason, note: note.trim() || undefined });
  }

  async function skip() {
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
        <p className="text-muted">
          {missedDate} looked harder than planned. A quick note can help you adjust the habit without turning it into a setback.
        </p>

        <div className="recovery-reflection__missed" aria-label="Missed habits">
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
                <small>{habit.completion_count}/{habit.target_count}</small>
              </span>
              <CategoryPill category={habit.category} />
            </label>
          ))}
        </div>

        <div className="rating-row" aria-label="Recovery reason">
          {REASONS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={reason === item.value ? 'is-active' : ''}
              onClick={() => setReason(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <textarea
          className="textarea"
          maxLength={1000}
          placeholder="Optional note: what would make this easier next time?"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />

        {error && <p className="field__error" role="alert">{error}</p>}

        <div className="modal-actions">
          <Button variant="ghost" type="button" onClick={skip} disabled={saving}>
            Skip
          </Button>
          <Link className="btn btn--secondary" to="/habits" onClick={onClose}>
            Adjust habits
          </Link>
          <Button variant="primary" type="submit" disabled={!reason || saving}>
            {saving ? 'Saving...' : 'Save reflection'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
