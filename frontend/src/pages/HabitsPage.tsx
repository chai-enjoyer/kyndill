import { useMemo, useState, type DragEvent, type FormEvent } from 'react';
import { AxiosError } from 'axios';
import { Button } from '../components/common/Button';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Modal } from '../components/common/Modal';
import { CategoryPill } from '../components/dashboard/CategoryPill';
import { useToastContext } from '../context/ToastContext';
import {
  useHabits,
  type HabitCategory,
  type HabitFormInput,
  type HabitFrequency,
  type HabitWithStatus,
} from '../hooks/useHabits';

const CATEGORIES: HabitCategory[] = ['Health', 'Productivity', 'Social', 'Learning', 'Wellness'];
const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 0 },
];

export function HabitsPage() {
  const { habits, isLoading, create, update, archive, reorder } = useHabits({ scope: 'all' });
  const { showToast } = useToastContext();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<HabitWithStatus | null>(null);
  const [deleting, setDeleting] = useState<HabitWithStatus | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const orderedIds = useMemo(() => habits.map((habit) => habit.id), [habits]);

  async function handleToggle(habit: HabitWithStatus) {
    try {
      await update(habit.id, { is_active: !habit.is_active });
      showToast(habit.is_active ? 'Habit paused.' : 'Habit reactivated.', 'success');
    } catch (err) {
      showToast(extractMessage(err), 'error');
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await archive(deleting.id);
      showToast('Habit deleted.', 'success');
      setDeleting(null);
    } catch (err) {
      showToast(extractMessage(err), 'error');
    }
  }

  async function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const from = orderedIds.indexOf(dragId);
    const to = orderedIds.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const next = [...orderedIds];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDragId(null);
    try {
      await reorder(next);
    } catch (err) {
      showToast(extractMessage(err), 'error');
    }
  }

  return (
    <section className="page habits-page">
      <header className="page__header habits-page__header">
        <div>
          <p className="page__eyebrow">Habit library</p>
          <h1>Habits</h1>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          Add Habit
        </Button>
      </header>

      {isLoading ? (
        <div className="habits-page__list" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <LoadingSkeleton key={i} width="100%" height={96} />
          ))}
        </div>
      ) : habits.length === 0 ? (
        <div className="habits-page__empty">
          <p>No habits yet.</p>
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            Add Habit
          </Button>
        </div>
      ) : (
        <ul className="habits-page__list" role="list">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              isDragging={dragId === habit.id}
              onDragStart={() => setDragId(habit.id)}
              onDragEnd={() => setDragId(null)}
              onDrop={() => handleDrop(habit.id)}
              onToggle={() => handleToggle(habit)}
              onEdit={() => setEditing(habit)}
              onDelete={() => setDeleting(habit)}
            />
          ))}
        </ul>
      )}

      {createOpen && (
        <HabitModal
          title="Create habit"
          onClose={() => setCreateOpen(false)}
          onSubmit={async (input) => {
            await create(input);
            showToast('Habit added.', 'success');
            setCreateOpen(false);
          }}
        />
      )}

      {editing && (
        <HabitModal
          title="Edit habit"
          habit={editing}
          onClose={() => setEditing(null)}
          onSubmit={async (input) => {
            await update(editing.id, input);
            showToast('Habit updated.', 'success');
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <Modal isOpen onClose={() => setDeleting(null)} title="Delete habit?">
          <p className="confirm-copy">
            Delete <strong>{deleting.name}</strong>? Completion history for this habit will be removed.
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}

interface HabitCardProps {
  habit: HabitWithStatus;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function HabitCard({
  habit,
  isDragging,
  onDragStart,
  onDragEnd,
  onDrop,
  onToggle,
  onEdit,
  onDelete,
}: HabitCardProps) {
  function handleDragOver(event: DragEvent<HTMLLIElement>) {
    event.preventDefault();
  }

  return (
    <li
      className={`habit-card ${isDragging ? 'habit-card--dragging' : ''} ${!habit.is_active ? 'habit-card--inactive' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={handleDragOver}
      onDrop={onDrop}
    >
      <span className="habit-card__handle" aria-label="Drag to reorder" title="Drag to reorder">
        <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor" aria-hidden="true">
          <circle cx="7" cy="5" r="1.4" />
          <circle cx="13" cy="5" r="1.4" />
          <circle cx="7" cy="10" r="1.4" />
          <circle cx="13" cy="10" r="1.4" />
          <circle cx="7" cy="15" r="1.4" />
          <circle cx="13" cy="15" r="1.4" />
        </svg>
      </span>
      <div className="habit-card__main">
        <div className="habit-card__title-row">
          <h2>{habit.name}</h2>
          <CategoryPill category={habit.category} />
        </div>
        {habit.description && <p className="habit-card__description">{habit.description}</p>}
        <div className="habit-card__meta">
          <span>{formatFrequency(habit)}</span>
          <span>{formatWindow(habit)}</span>
          <span className="habit-card__streak">{habit.current_streak} day streak</span>
        </div>
      </div>
      <div className="habit-card__actions">
        <label className="switch">
          <input type="checkbox" checked={habit.is_active} onChange={onToggle} />
          <span className="switch__track" aria-hidden="true" />
          <span className="switch__label">{habit.is_active ? 'Active' : 'Inactive'}</span>
        </label>
        <Button variant="secondary" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </li>
  );
}

interface HabitModalProps {
  title: string;
  habit?: HabitWithStatus;
  onClose: () => void;
  onSubmit: (input: HabitFormInput) => Promise<void>;
}

function HabitModal({ title, habit, onClose, onSubmit }: HabitModalProps) {
  const { showToast } = useToastContext();
  const [name, setName] = useState(habit?.name ?? '');
  const [description, setDescription] = useState(habit?.description ?? '');
  const [category, setCategory] = useState<HabitCategory>(habit?.category ?? 'Health');
  const [frequency, setFrequency] = useState<HabitFrequency>(habit?.frequency ?? 'daily');
  const [days, setDays] = useState<number[]>(habit?.days_of_week ?? [1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState(normalizeTime(habit?.completion_start_time));
  const [endTime, setEndTime] = useState(normalizeTime(habit?.completion_end_time));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors = validateForm({ name, frequency, days, startTime, endTime });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description,
        category,
        frequency,
        days_of_week: frequency === 'weekly' ? days : undefined,
        completion_start_time: startTime || null,
        completion_end_time: endTime || null,
      });
    } catch (err) {
      showToast(extractMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function toggleDay(value: number) {
    setDays((prev) =>
      prev.includes(value) ? prev.filter((day) => day !== value) : [...prev, value].sort(),
    );
  }

  return (
    <Modal isOpen onClose={onClose} title={title}>
      <form className="habit-form" onSubmit={handleSubmit}>
        <div className={`field ${errors.name ? 'field--error' : ''}`}>
          <label className="field__label" htmlFor="habit-name">Name</label>
          <input id="habit-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          {errors.name && <span className="field__error">{errors.name}</span>}
        </div>

        <div className="field">
          <label className="field__label" htmlFor="habit-description">Description</label>
          <textarea
            id="habit-description"
            className="textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="habit-form__grid">
          <div className="field">
            <label className="field__label" htmlFor="habit-category">Category</label>
            <select id="habit-category" className="input" value={category} onChange={(e) => setCategory(e.target.value as HabitCategory)}>
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="habit-frequency">Frequency</label>
            <select id="habit-frequency" className="input" value={frequency} onChange={(e) => setFrequency(e.target.value as HabitFrequency)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>

        {frequency === 'weekly' && (
          <div className={`field ${errors.days ? 'field--error' : ''}`}>
            <span className="field__label">Days</span>
            <div className="day-selector">
              {DAYS.map((day) => (
                <label key={day.value} className="day-selector__item">
                  <input
                    type="checkbox"
                    checked={days.includes(day.value)}
                    onChange={() => toggleDay(day.value)}
                  />
                  <span>{day.label}</span>
                </label>
              ))}
            </div>
            {errors.days && <span className="field__error">{errors.days}</span>}
          </div>
        )}

        <div className="habit-form__grid">
          <div className={`field ${errors.window ? 'field--error' : ''}`}>
            <label className="field__label" htmlFor="habit-start">Start</label>
            <input id="habit-start" className="input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div className={`field ${errors.window ? 'field--error' : ''}`}>
            <label className="field__label" htmlFor="habit-end">End</label>
            <input id="habit-end" className="input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>
        {errors.window && <span className="field__error">{errors.window}</span>}

        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function validateForm(input: {
  name: string;
  frequency: HabitFrequency;
  days: number[];
  startTime: string;
  endTime: string;
}) {
  const errors: Record<string, string> = {};
  if (!input.name.trim()) errors.name = 'Name is required.';
  if (input.name.trim().length > 100) errors.name = 'Name must be 100 characters or fewer.';
  if (input.frequency === 'weekly' && input.days.length === 0) {
    errors.days = 'Choose at least one day.';
  }
  if ((input.startTime && !input.endTime) || (!input.startTime && input.endTime)) {
    errors.window = 'Choose both start and end times, or leave both empty.';
  } else if (input.startTime && input.endTime && input.startTime >= input.endTime) {
    errors.window = 'End time must be after start time.';
  }
  return errors;
}

function normalizeTime(value?: string | null): string {
  return value ? value.slice(0, 5) : '';
}

function formatFrequency(habit: HabitWithStatus): string {
  if (habit.frequency === 'daily') return 'Daily';
  const labels = DAYS.filter((day) => habit.days_of_week?.includes(day.value)).map((day) => day.label);
  return labels.length > 0 ? `Weekly: ${labels.join(', ')}` : 'Weekly';
}

function formatWindow(habit: HabitWithStatus): string {
  const start = normalizeTime(habit.completion_start_time);
  const end = normalizeTime(habit.completion_end_time);
  if (!start || !end) return 'Any time';
  return `${start}-${end}`;
}

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { message?: string } } | undefined;
    return data?.error?.message ?? 'Something did not save. Try again.';
  }
  return 'Something did not save. Try again.';
}
