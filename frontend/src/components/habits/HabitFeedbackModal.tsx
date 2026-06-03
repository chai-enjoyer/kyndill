import { useState, type FormEvent } from 'react';
import { AxiosError } from 'axios';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { api } from '../../lib/api';

interface HabitFeedbackModalProps {
  habitId: string;
  habitName: string;
  onClose: () => void;
}

// два ряда по три: позитивная линия (Energized/Proud/Calm) и тяжёлая (Foggy/Tough/Drained).
// шесть штук - баланс между нагрузкой на выбор и полезным сигналом для исследования
const MOODS = [
  { value: 'energized', label: 'Energized' },
  { value: 'proud', label: 'Proud' },
  { value: 'calm', label: 'Calm' },
  { value: 'foggy', label: 'Foggy' },
  { value: 'tough', label: 'Tough' },
  { value: 'drained', label: 'Drained' },
];

export function HabitFeedbackModal({ habitId, habitName, onClose }: HabitFeedbackModalProps) {
  const [mood, setMood] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!mood || submitting) return;
    setSubmitting(true);
    try {
      await api.post('/api/feedback', {
        habit_id: habitId,
        context: 'habit_completion',
        mood,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(extractMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="How did that feel?">
      <form className="habit-feedback" onSubmit={submit}>
        <p className="text-muted">Optional feedback for "{habitName}" helps evaluate motivation and usability without recording personal identifiers.</p>
        <div className="reflection-chips" role="radiogroup" aria-label="Habit completion feeling">
          {MOODS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="radio"
              aria-checked={mood === item.value}
              className={`reflection-chip${mood === item.value ? ' is-active' : ''}`}
              onClick={() => setMood(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <textarea
          className="textarea"
          maxLength={1000}
          placeholder="Optional note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        {error && <p className="field__error" role="alert">{error}</p>}
        <div className="modal-actions">
          <Button variant="ghost" type="button" onClick={onClose}>
            Skip
          </Button>
          <Button variant="primary" type="submit" disabled={!mood || submitting}>
            {submitting ? 'Saving...' : 'Save feedback'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? 'Could not save feedback.';
  }
  return 'Could not save feedback.';
}
