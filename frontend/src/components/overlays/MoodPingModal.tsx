import { useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface MoodPingModalProps {
  onSubmit: (rating: number, note?: string) => Promise<void>;
  onSnooze: () => void;
}

const SCALE = [
  { value: 1, label: 'Heavy' },
  { value: 2, label: 'Off-beat' },
  { value: 3, label: 'Steady' },
  { value: 4, label: 'Light' },
  { value: 5, label: 'Bright' },
] as const;

export function MoodPingModal({ onSubmit, onSnooze }: MoodPingModalProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const previewed = hover ?? rating;
  const promptLabel = previewed
    ? SCALE.find((s) => s.value === previewed)?.label
    : 'How is the week feeling?';

  async function handleSubmit() {
    if (rating === null || saving) return;
    setSaving(true);
    try {
      await onSubmit(rating, note.trim() || undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen onClose={onSnooze} title="Weekly check-in">
      <div className="mood-ping">
        <p>One question, once a week. We're trying to see how Kyndill is landing.</p>
        <div className="mood-ping__scale" onMouseLeave={() => setHover(null)} role="radiogroup" aria-label="How is the week feeling?">
          <span className="mood-ping__prompt" aria-live="polite">{promptLabel}</span>
          <div className="mood-ping__buttons">
            {SCALE.map((step) => {
              const filled = previewed !== null && step.value <= previewed;
              return (
                <button
                  key={step.value}
                  type="button"
                  role="radio"
                  aria-checked={rating === step.value}
                  aria-label={`${step.value} of 5 – ${step.label}`}
                  className={`mood-dot${filled ? ' is-filled' : ''}${rating === step.value ? ' is-selected' : ''}`}
                  onMouseEnter={() => setHover(step.value)}
                  onFocus={() => setHover(step.value)}
                  onBlur={() => setHover(null)}
                  onClick={() => setRating((current) => (current === step.value ? null : step.value))}
                  disabled={saving}
                >
                  <span aria-hidden="true">{step.value}</span>
                </button>
              );
            })}
          </div>
        </div>
        <label className="mood-ping__note">
          <span>Anything you want to add? (optional)</span>
          <textarea
            className="textarea"
            rows={2}
            maxLength={500}
            placeholder="e.g. work has been busy; rested better this week"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={saving}
          />
        </label>
        <div className="modal-actions">
          <Button variant="ghost" type="button" onClick={onSnooze} disabled={saving}>
            Maybe later
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={handleSubmit}
            disabled={saving || rating === null}
          >
            {saving ? 'Saving…' : 'Send'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
