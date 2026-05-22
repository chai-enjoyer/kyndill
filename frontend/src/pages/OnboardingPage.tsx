import { useId, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { Button } from '../components/common/Button';
// PLACEHOLDER: Replace with final onboarding pet artist assets when delivered.
import { type PetSpecies } from '../components/common/PlaceholderPet';
import { SpritePet } from '../components/common/SpritePet';
import { Spinner } from '../components/common/Spinner';
import { api } from '../lib/api';
import {
  DEFAULT_TEMPLATE_IDS,
  HABIT_TEMPLATES,
  formatTemplateMeta,
  pickStarterTemplates,
  templateToHabitInput,
  type HabitIntent,
  type HabitTimeOfDay,
  type QuizAnswers,
  type QuizBlocker,
  type QuizEnergy,
  type QuizPace,
} from '../lib/habitTemplates';
import type { HabitCategory } from '../hooks/useHabits';
import { useAuthContext } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';

const NAME_MAX = 20;

interface SpeciesOption {
  species: PetSpecies;
  label: string;
  hint: string;
}

const SPECIES_OPTIONS: SpeciesOption[] = [
  { species: 'star', label: 'Star', hint: 'Bright, expressive.' },
  { species: 'cube', label: 'Cube', hint: 'Steady, methodical.' },
  { species: 'sphere', label: 'Sphere', hint: 'Curious, social.' },
  { species: 'pyramid', label: 'Pyramid', hint: 'Quiet, focused.' },
];

type Step = 'consent' | 'tour' | 'quiz' | 'species' | 'name' | 'habits';

const STEPS: { key: Step; label: string }[] = [
  { key: 'consent', label: 'Privacy' },
  { key: 'tour', label: 'How' },
  { key: 'quiz', label: 'You' },
  { key: 'species', label: 'Companion' },
  { key: 'name', label: 'Name' },
  { key: 'habits', label: 'Habits' },
];

const TOUR_CARDS = [
  {
    title: 'Complete habits',
    copy: "Checking off today's habits gives XP, coins, streak progress, and a quick mood prompt.",
    icon: 'M7 12.5 10.5 16 17.5 8',
  },
  {
    title: 'Care for your pet',
    copy: 'Health is shaped by streak momentum and care stats. Habit effort uses hunger, energy, cleanliness, and happiness, so food items matter.',
    icon: 'M12 21s-7-4.5-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-7 10-7 10z',
  },
  {
    title: 'Spend rewards',
    copy: 'Coins buy consumables, streak freezes, and cosmetics. Drops mostly give useful consumables, with cosmetics as rare finds.',
    icon: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM9.2 10.1c1.2-1 4.4-1 5.6 0M14.8 14c-1.2 1-4.4 1-5.6 0',
  },
  {
    title: 'Use focus and friends',
    copy: 'Focus sessions earn coins by time invested. Friends, gifts, and leaderboards add gentle accountability.',
    icon: 'M12 4v3M12 17v3M4 12h3M17 12h3M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  },
];

const INTENT_OPTIONS: { value: HabitIntent; label: string; hint: string }[] = [
  { value: 'body', label: 'A stronger body', hint: 'Move daily, sleep well, eat real food.' },
  { value: 'mind', label: 'A sharper mind', hint: 'Think clearer, focus deeper, learn steadily.' },
  { value: 'heart', label: 'A steadier heart', hint: 'Stay grounded. Stay connected.' },
  { value: 'creative', label: 'A maker’s practice', hint: 'Write, draw, play, build — even small.' },
  { value: 'space', label: 'A calmer space', hint: 'Tidy, plan, live in less noise.' },
];

const PACE_OPTIONS: { value: QuizPace; label: string; hint: string }[] = [
  { value: 'packed', label: 'Squeezed', hint: 'Two-minute habits only.' },
  { value: 'mixed', label: 'Room enough', hint: 'Ten to fifteen minutes.' },
  { value: 'spacious', label: 'Wide open', hint: 'Up for bigger commitments.' },
];

const TIME_OPTIONS: { value: HabitTimeOfDay; label: string }[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'midday', label: 'Midday or breaks' },
  { value: 'evening', label: 'Evening' },
  { value: 'weekend', label: 'Weekends' },
];

const ENERGY_OPTIONS: { value: QuizEnergy; label: string; hint: string }[] = [
  { value: 'low', label: 'Recovering', hint: 'Tiny everything. No heroics.' },
  { value: 'steady', label: 'Holding the line', hint: 'Keeping the rhythm going.' },
  { value: 'building', label: 'Climbing', hint: 'Ready to grow a little.' },
];

const BLOCKER_OPTIONS: { value: QuizBlocker; label: string; hint: string }[] = [
  { value: 'forgetting', label: 'I forget', hint: 'Need visible cues at the right time.' },
  { value: 'energy', label: 'Low fuel', hint: 'Smallest-possible habits work best.' },
  { value: 'time', label: 'No time', hint: 'Two-minute floors over hour-long plans.' },
  { value: 'all-or-nothing', label: 'All-or-nothing brain', hint: 'Partial counts as progress.' },
];

const HABIT_CATEGORIES: HabitCategory[] = ['Health', 'Productivity', 'Social', 'Learning', 'Wellness'];

interface CustomHabitDraft {
  id: string;
  name: string;
  category: HabitCategory;
  target_count: number;
}

const MAX_CUSTOM_HABITS = 5;

function makeCustomHabit(): CustomHabitDraft {
  return {
    id: `draft-${Math.random().toString(36).slice(2, 9)}`,
    name: '',
    category: 'Wellness',
    target_count: 1,
  };
}

const DEFAULT_QUIZ: QuizAnswers = {
  intents: ['body', 'mind'],
  pace: 'mixed',
  times: ['morning', 'evening'],
  energy: 'steady',
  blocker: 'forgetting',
};

export function OnboardingPage() {
  const navigate = useNavigate();
  const { markPetInitialized, mergeUser } = useAuthContext();
  const { showToast } = useToastContext();

  const [step, setStep] = useState<Step>('consent');
  const [species, setSpecies] = useState<PetSpecies | null>(null);
  const [name, setName] = useState('');
  const [researchConsent, setResearchConsent] = useState(false);
  const [moodPingOptIn, setMoodPingOptIn] = useState(false);
  const [quiz, setQuiz] = useState<QuizAnswers | null>(null);
  const [selectedStarterIds, setSelectedStarterIds] = useState<string[]>([...DEFAULT_TEMPLATE_IDS]);
  const [customHabits, setCustomHabits] = useState<CustomHabitDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputId = useId();
  const counterId = useId();

  const trimmedName = name.trim();
  const isNameValid = trimmedName.length >= 1 && trimmedName.length <= NAME_MAX;
  const quizPickedIds = useMemo(
    () => new Set(quiz ? pickStarterTemplates(quiz) : []),
    [quiz],
  );

  // Group templates by category for a calmer scan in the habits step. Order
  // matches the brand surface (wellness/health first, then productivity, etc).
  const groupedTemplates = useMemo(() => {
    const groups: Record<HabitCategory, typeof HABIT_TEMPLATES> = {
      Health: [],
      Wellness: [],
      Productivity: [],
      Learning: [],
      Social: [],
    };
    for (const habit of HABIT_TEMPLATES) {
      groups[habit.category].push(habit);
    }
    return groups;
  }, []);

  function toggleStarterHabit(id: string) {
    setSelectedStarterIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  function applyQuiz(answers: QuizAnswers) {
    setQuiz(answers);
    setSelectedStarterIds(pickStarterTemplates(answers));
    setStep('species');
    // Best-effort persistence for research baseline. We don't await; a network
    // failure here shouldn't block the user from continuing onboarding.
    void api.post('/api/onboarding/quiz', answers).catch(() => undefined);
  }

  function applyDefaultQuiz() {
    applyQuiz(DEFAULT_QUIZ);
  }

  function addCustomHabit() {
    setCustomHabits((prev) =>
      prev.length >= MAX_CUSTOM_HABITS ? prev : [...prev, makeCustomHabit()],
    );
  }

  function updateCustomHabit(id: string, patch: Partial<CustomHabitDraft>) {
    setCustomHabits((prev) =>
      prev.map((habit) => (habit.id === id ? { ...habit, ...patch } : habit)),
    );
  }

  function removeCustomHabit(id: string) {
    setCustomHabits((prev) => prev.filter((habit) => habit.id !== id));
  }

  const validCustomHabits = useMemo(
    () =>
      customHabits
        .map((draft) => ({ ...draft, name: draft.name.trim() }))
        .filter((draft) => draft.name.length > 0),
    [customHabits],
  );

  async function handleComplete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!species || !isNameValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      // 1) Pet init. ALREADY_INITIALIZED is fine — keep going so we still
      // create habits for users coming back to a partially-finished onboard.
      try {
        await api.post('/api/pet/initialize', { species, name: trimmedName });
      } catch (err) {
        if (
          !(
            err instanceof AxiosError &&
            (err.response?.data as { error?: { code?: string } } | undefined)?.error?.code ===
              'ALREADY_INITIALIZED'
          )
        ) {
          throw err;
        }
      }

      // 2) Profile patch is best-effort. A schema mismatch here (e.g. an
      // un-applied migration) used to abort the whole flow and leave the
      // user with no habits. Keep going either way.
      void api
        .patch('/api/user/profile', {
          research_consent: researchConsent,
          notification_prefs: {
            friendRequests: true,
            gifts: true,
            focusReminders: true,
            dailyReminder: true,
            moodPing: researchConsent && moodPingOptIn,
          },
        })
        .then(() => {
          // Flip the in-memory consent flag immediately so analytics start
          // capturing the rest of this session without waiting for a reload.
          mergeUser({ research_consent: researchConsent });
        })
        .catch(() => undefined);

      // 3) Habit creation: Promise.allSettled so one bad row doesn't sink
      // every other habit.
      const selectedStarters = HABIT_TEMPLATES.filter((habit) =>
        selectedStarterIds.includes(habit.id),
      );
      const habitRequests = [
        ...selectedStarters.map((habit) =>
          api.post('/api/habits', templateToHabitInput(habit)),
        ),
        ...validCustomHabits.map((draft) =>
          api.post('/api/habits', {
            name: draft.name,
            description: 'Created during onboarding.',
            category: draft.category,
            frequency: 'daily' as const,
            target_count: Math.max(1, Math.min(12, draft.target_count)),
          }),
        ),
      ];

      if (habitRequests.length > 0) {
        const results = await Promise.allSettled(habitRequests);
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed === results.length) {
          const firstError = results.find(
            (r): r is PromiseRejectedResult => r.status === 'rejected',
          )?.reason;
          throw firstError ?? new Error('Could not save your habits.');
        }
        if (failed > 0) {
          showToast(
            `${results.length - failed} of ${results.length} habits saved. The rest can be added from the Habits page.`,
            'info',
          );
        }
      }

      markPetInitialized();
      navigate('/', { replace: true });
    } catch (err) {
      showToast(extractMessage(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="onboarding-page">
      <ol className="onboarding-steps" aria-label="Onboarding progress">
        {STEPS.map((item, index) => (
          <li key={item.key} className={`onboarding-steps__step ${stepClass(step, item.key)}`}>
            <span className="onboarding-steps__num" aria-hidden="true">{index + 1}</span>
            <span>{item.label}</span>
          </li>
        ))}
      </ol>

      {step === 'consent' ? (
        <section className="onboarding-step onboarding-step--consent" aria-labelledby="onboarding-step-privacy-heading">
          <header className="onboarding-step__header">
            <h1 id="onboarding-step-privacy-heading">A clear start.</h1>
            <p className="text-muted">
              Kyndill is research software. Before you set anything up, here's exactly what we
              store about you, what we don't, and how to withdraw.
            </p>
          </header>

          <div className="consent-card">
            <h2>What we record</h2>
            <ul className="consent-card__list">
              <li>Habits you create and your daily check-ins (when, which, how many).</li>
              <li>Focus sessions: start, duration, optional rating.</li>
              <li>Pet, shop, inventory, and friend interactions inside the app.</li>
              <li>Which screens you visit, and feature usage, to understand how Kyndill is used.</li>
              <li>Reflections you write yourself: recovery notes, habit feelings, feedback messages.</li>
            </ul>

            <h2>What never leaves your account</h2>
            <ul className="consent-card__list consent-card__list--negative">
              <li>Your email, name, username, avatar, and bio are stripped from any research export.</li>
              <li>Every export is keyed on a random research pseudonym, not your real ID.</li>
              <li>We do not record keystrokes, mouse movements, or anything outside Kyndill.</li>
            </ul>

            <h2>How to withdraw</h2>
            <p>
              Turn off "Participate in evaluation" in Settings at any time. New data stops being
              collected immediately. You can also delete your account, which removes every row
              associated with you.
            </p>
          </div>

          <fieldset className="consent-choices">
            <legend className="visually-hidden">Data collection choices</legend>
            <label className="consent-check">
              <input
                type="checkbox"
                checked={researchConsent}
                onChange={(event) => {
                  const next = event.target.checked;
                  setResearchConsent(next);
                  if (!next) setMoodPingOptIn(false);
                }}
              />
              <span>
                <strong>Participate in evaluation.</strong> Required to use Kyndill while it is in
                research mode. Anonymized interactions and self-reported feedback are stored as
                described above.
              </span>
            </label>
            <label
              className={`consent-check consent-check--secondary${researchConsent ? '' : ' consent-check--disabled'}`}
            >
              <input
                type="checkbox"
                checked={moodPingOptIn}
                disabled={!researchConsent}
                onChange={(event) => setMoodPingOptIn(event.target.checked)}
              />
              <span>
                <strong>Send me a weekly mood check-in.</strong> One short question, once a
                week, asking how the week felt. Optional, snoozable, and only sent if you've
                opted in here.
              </span>
            </label>
          </fieldset>

          <div className="onboarding-actions">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setStep('tour')}
              disabled={!researchConsent}
            >
              Continue
            </Button>
          </div>
        </section>
      ) : step === 'tour' ? (
        <section className="onboarding-step" aria-labelledby="onboarding-step-tour-heading">
          <header className="onboarding-step__header">
            <h1 id="onboarding-step-tour-heading">How Kyndill works.</h1>
            <p className="text-muted">
              The loop is simple: show up, earn progress, care for your companion, and use rewards
              to keep going.
            </p>
          </header>

          <div className="onboarding-tour-grid">
            {TOUR_CARDS.map((card) => (
              <article className="onboarding-tour-card" key={card.title}>
                <span className="onboarding-tour-card__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={card.icon} />
                  </svg>
                </span>
                <h2>{card.title}</h2>
                <p>{card.copy}</p>
              </article>
            ))}
          </div>

          <div className="onboarding-balance-note">
            <strong>Starting balance</strong>
            <span>
              New users begin with 20 coins and two streak freezes. Care stats start full, while
              health depends on those stats and your streak momentum.
            </span>
          </div>

          <div className="onboarding-actions">
            <Button variant="ghost" type="button" onClick={() => setStep('consent')}>Back</Button>
            <Button variant="primary" size="lg" onClick={() => setStep('quiz')}>
              What are you reaching for?
            </Button>
          </div>
        </section>
      ) : step === 'quiz' ? (
        <QuizStep
          initial={quiz ?? DEFAULT_QUIZ}
          onBack={() => setStep('tour')}
          onSkip={applyDefaultQuiz}
          onSubmit={applyQuiz}
        />
      ) : step === 'species' ? (
        <section className="onboarding-step" aria-labelledby="onboarding-step-species-heading">
          <header className="onboarding-step__header">
            <h1 id="onboarding-step-species-heading">Choose your companion.</h1>
            <p className="text-muted">Pick one to start. You can rename them on the next step.</p>
          </header>

          <ul className="pet-option-grid" role="radiogroup" aria-label="Pet species">
            {SPECIES_OPTIONS.map((option) => (
              <li key={option.species}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={species === option.species}
                  className={
                    'pet-option ' + (species === option.species ? 'pet-option--selected' : '')
                  }
                  onClick={() => setSpecies(option.species)}
                >
                  <span className="pet-option__art" aria-hidden="true">
                    <SpritePet species={option.species} mood="happy" size={120} />
                  </span>
                  <span className="pet-option__label">{option.label}</span>
                  <span className="pet-option__hint text-muted">{option.hint}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="onboarding-actions">
            <Button variant="ghost" type="button" onClick={() => setStep('quiz')}>Back</Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => species && setStep('name')}
              disabled={!species}
            >
              Continue
            </Button>
          </div>
        </section>
      ) : step === 'name' ? (
        <section className="onboarding-step" aria-labelledby="onboarding-step-name-heading">
          <header className="onboarding-step__header">
            <h1 id="onboarding-step-name-heading">Name them.</h1>
            <p className="text-muted">Anything you will say tenderly.</p>
          </header>

          <div className="onboarding-name">
            <figure className="onboarding-name__preview">
              {species && (
                <SpritePet species={species} mood="happy" size={180} className="pet-breathing" />
              )}
              <figcaption className="onboarding-name__caption">
                {trimmedName.length > 0 ? trimmedName : 'unnamed'}
              </figcaption>
            </figure>

            <form
              className="onboarding-name__form"
              onSubmit={(event) => {
                event.preventDefault();
                if (isNameValid) setStep('habits');
              }}
              noValidate
            >
              <div className="field">
                <label className="field__label" htmlFor={nameInputId}>Their name</label>
                <input
                  id={nameInputId}
                  className="input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
                  maxLength={NAME_MAX}
                  autoFocus
                  aria-describedby={counterId}
                  autoComplete="off"
                  required
                />
                <p id={counterId} className="field__help" aria-live="polite">
                  {trimmedName.length}/{NAME_MAX}
                </p>
              </div>

              <div className="onboarding-actions">
                <Button variant="ghost" type="button" onClick={() => setStep('species')}>Back</Button>
                <Button variant="primary" size="lg" type="submit" disabled={!isNameValid}>
                  Choose first habits
                </Button>
              </div>
            </form>
          </div>
        </section>
      ) : (
        <section className="onboarding-step" aria-labelledby="onboarding-step-habits-heading">
          <header className="onboarding-step__header">
            <h1 id="onboarding-step-habits-heading">Start with one small promise.</h1>
            <p className="text-muted">
              {quiz
                ? 'We pre-selected a few based on your answers. Tick more, untick any, or add your own.'
                : 'Pick ready-made habits, add your own, or do both. You can edit any of these later.'}
            </p>
            <p className="onboarding-habits-count" aria-live="polite">
              <strong>{selectedStarterIds.length + validCustomHabits.length}</strong>{' '}
              habit{selectedStarterIds.length + validCustomHabits.length === 1 ? '' : 's'} ready to start.
            </p>
          </header>

          <form className="onboarding-habits" onSubmit={handleComplete} noValidate>
            <div className="starter-habit-groups" aria-label="Starter habits">
              {HABIT_CATEGORIES.filter((category) => groupedTemplates[category].length > 0).map(
                (category) => (
                  <div key={category} className="starter-habit-group">
                    <h2 className="starter-habit-group__title">{category}</h2>
                    <div className="starter-habit-grid">
                      {groupedTemplates[category].map((habit) => {
                        const selected = selectedStarterIds.includes(habit.id);
                        const recommended = quizPickedIds.has(habit.id);
                        return (
                          <label
                            key={habit.id}
                            className={`starter-habit ${selected ? 'starter-habit--selected' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={() => toggleStarterHabit(habit.id)}
                            />
                            <span className="starter-habit__body">
                              <span className="starter-habit__heading">
                                <strong>{habit.name}</strong>
                                {recommended && (
                                  <span
                                    className="starter-habit__badge"
                                    title="Pre-selected based on your answers"
                                  >
                                    Pick for you
                                  </span>
                                )}
                              </span>
                              <span>{habit.description}</span>
                              <em>{formatTemplateMeta(habit)}</em>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ),
              )}
            </div>

            <div className="onboarding-custom-habits" aria-label="Your own habits">
              <div className="onboarding-custom-habits__head">
                <h2>Your own habits</h2>
                <p className="text-muted">
                  Add up to {MAX_CUSTOM_HABITS}. Daily by default — you can change frequency
                  and timing later from the Habits page.
                </p>
              </div>
              {customHabits.length === 0 ? (
                <p className="text-muted onboarding-custom-habits__empty">
                  Nothing here yet. Tap "Add habit" below to create your first one.
                </p>
              ) : (
                <ul className="custom-habit-list" role="list">
                  {customHabits.map((draft, index) => (
                    <li key={draft.id} className="custom-habit-card">
                      <div className="custom-habit-card__head">
                        <span className="custom-habit-card__index">Habit {index + 1}</span>
                        <button
                          type="button"
                          className="custom-habit-card__remove"
                          aria-label={`Remove habit ${index + 1}`}
                          onClick={() => removeCustomHabit(draft.id)}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M6 6l12 12M6 18 18 6" />
                          </svg>
                          <span>Remove</span>
                        </button>
                      </div>
                      <div className="custom-habit-card__grid">
                        <div className="field">
                          <label
                            className="field__label"
                            htmlFor={`custom-habit-${draft.id}-name`}
                          >
                            What is the habit?
                          </label>
                          <input
                            id={`custom-habit-${draft.id}-name`}
                            className="input"
                            type="text"
                            value={draft.name}
                            onChange={(event) =>
                              updateCustomHabit(draft.id, {
                                name: event.target.value.slice(0, 80),
                              })
                            }
                            placeholder="e.g. Read 10 pages"
                            autoComplete="off"
                          />
                        </div>
                        <div className="field">
                          <label
                            className="field__label"
                            htmlFor={`custom-habit-${draft.id}-category`}
                          >
                            Category
                          </label>
                          <select
                            id={`custom-habit-${draft.id}-category`}
                            className="input"
                            value={draft.category}
                            onChange={(event) =>
                              updateCustomHabit(draft.id, {
                                category: event.target.value as HabitCategory,
                              })
                            }
                          >
                            {HABIT_CATEGORIES.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                          <p className="field__help">Used for grouping and colour only.</p>
                        </div>
                        <div className="field">
                          <label
                            className="field__label"
                            htmlFor={`custom-habit-${draft.id}-target`}
                          >
                            How many times per day?
                          </label>
                          <input
                            id={`custom-habit-${draft.id}-target`}
                            className="input"
                            type="number"
                            min={1}
                            max={12}
                            value={draft.target_count}
                            onChange={(event) =>
                              updateCustomHabit(draft.id, {
                                target_count: Math.max(
                                  1,
                                  Math.min(12, Number(event.target.value) || 1),
                                ),
                              })
                            }
                          />
                          <p className="field__help">
                            Use 1 for a once-a-day habit, or higher for repeatable things like
                            drinking water.
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="custom-habit-add"
                onClick={addCustomHabit}
                disabled={customHabits.length >= MAX_CUSTOM_HABITS}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add habit
              </button>
            </div>

            <div className="onboarding-actions">
              <Button variant="ghost" type="button" onClick={() => setStep('name')}>Back</Button>
              <Button
                variant="primary"
                size="lg"
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting || undefined}
              >
                {isSubmitting ? <Spinner /> : null}
                Light the flame
              </Button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}

interface QuizStepProps {
  initial: QuizAnswers;
  onBack: () => void;
  onSkip: () => void;
  onSubmit: (answers: QuizAnswers) => void;
}

function QuizStep({ initial, onBack, onSkip, onSubmit }: QuizStepProps) {
  const [intents, setIntents] = useState<HabitIntent[]>(initial.intents);
  const [pace, setPace] = useState<QuizPace>(initial.pace);
  const [times, setTimes] = useState<HabitTimeOfDay[]>(initial.times);
  const [energy, setEnergy] = useState<QuizEnergy>(initial.energy);
  const [blocker, setBlocker] = useState<QuizBlocker>(initial.blocker);

  const canContinue = intents.length > 0 && times.length > 0;

  function toggleIntent(value: HabitIntent) {
    setIntents((prev) => {
      if (prev.includes(value)) return prev.filter((item) => item !== value);
      if (prev.length >= 3) return prev;
      return [...prev, value];
    });
  }

  function toggleTime(value: HabitTimeOfDay) {
    setTimes((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  }

  return (
    <section className="onboarding-step" aria-labelledby="onboarding-step-quiz-heading">
      <header className="onboarding-step__header">
        <h1 id="onboarding-step-quiz-heading">Who are you tending toward?</h1>
        <p className="text-muted">
          Five quick questions so we can pick starting habits that fit. Nothing is locked in — you
          can change any of this later.
        </p>
      </header>

      <div className="quiz">
        <QuizQuestion
          title="I want to grow…"
          hint="Pick up to three."
        >
          <div className="quiz-chips" role="group">
            {INTENT_OPTIONS.map((option) => (
              <QuizChip
                key={option.value}
                pressed={intents.includes(option.value)}
                onClick={() => toggleIntent(option.value)}
                label={option.label}
                hint={option.hint}
              />
            ))}
          </div>
        </QuizQuestion>

        <QuizQuestion title="How much room do your days have?">
          <div className="quiz-chips" role="radiogroup" aria-label="Pace">
            {PACE_OPTIONS.map((option) => (
              <QuizChip
                key={option.value}
                role="radio"
                pressed={pace === option.value}
                onClick={() => setPace(option.value)}
                label={option.label}
                hint={option.hint}
              />
            ))}
          </div>
        </QuizQuestion>

        <QuizQuestion
          title="When will you show up?"
          hint="Any time that fits."
        >
          <div className="quiz-chips" role="group">
            {TIME_OPTIONS.map((option) => (
              <QuizChip
                key={option.value}
                pressed={times.includes(option.value)}
                onClick={() => toggleTime(option.value)}
                label={option.label}
              />
            ))}
          </div>
        </QuizQuestion>

        <QuizQuestion title="What season are you in?">
          <div className="quiz-chips" role="radiogroup" aria-label="Energy">
            {ENERGY_OPTIONS.map((option) => (
              <QuizChip
                key={option.value}
                role="radio"
                pressed={energy === option.value}
                onClick={() => setEnergy(option.value)}
                label={option.label}
                hint={option.hint}
              />
            ))}
          </div>
        </QuizQuestion>

        <QuizQuestion title="What trips you up most?">
          <div className="quiz-chips" role="radiogroup" aria-label="Biggest blocker">
            {BLOCKER_OPTIONS.map((option) => (
              <QuizChip
                key={option.value}
                role="radio"
                pressed={blocker === option.value}
                onClick={() => setBlocker(option.value)}
                label={option.label}
                hint={option.hint}
              />
            ))}
          </div>
        </QuizQuestion>
      </div>

      <div className="onboarding-actions onboarding-actions--quiz">
        <Button variant="ghost" type="button" onClick={onBack}>Back</Button>
        <button type="button" className="quiz-skip" onClick={onSkip}>
          Skip — pick for me
        </button>
        <Button
          variant="primary"
          size="lg"
          type="button"
          onClick={() => onSubmit({ intents, pace, times, energy, blocker })}
          disabled={!canContinue}
        >
          Continue
        </Button>
      </div>
    </section>
  );
}

interface QuizQuestionProps {
  title: string;
  hint?: string;
  children: React.ReactNode;
}

function QuizQuestion({ title, hint, children }: QuizQuestionProps) {
  return (
    <fieldset className="quiz-question">
      <legend>{title}</legend>
      {hint && <p className="quiz-question__hint text-muted">{hint}</p>}
      {children}
    </fieldset>
  );
}

interface QuizChipProps {
  pressed: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
  role?: 'radio' | 'button';
}

function QuizChip({ pressed, onClick, label, hint, role = 'button' }: QuizChipProps) {
  const ariaProps =
    role === 'radio' ? { role: 'radio' as const, 'aria-checked': pressed } : { 'aria-pressed': pressed };
  return (
    <button
      type="button"
      className={`quiz-chip${pressed ? ' is-pressed' : ''}`}
      onClick={onClick}
      {...ariaProps}
    >
      <span className="quiz-chip__label">{label}</span>
      {hint && <span className="quiz-chip__hint">{hint}</span>}
    </button>
  );
}

function stepClass(current: Step, item: Step): string {
  const currentIndex = STEPS.findIndex((step) => step.key === current);
  const itemIndex = STEPS.findIndex((step) => step.key === item);
  if (currentIndex === itemIndex) return 'is-current';
  if (itemIndex < currentIndex) return 'is-done';
  return '';
}

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as { error?: { code?: string; message?: string } } | undefined;
    const code = data?.error?.code;
    if (code === 'ALREADY_INITIALIZED') return 'Your companion is already set up.';
    if (code === 'INVALID_NAME') return 'Names must be 1 to 20 characters.';
    if (data?.error?.message) return data.error.message;
  }
  return 'Something went wrong setting up your companion. Please try again.';
}
