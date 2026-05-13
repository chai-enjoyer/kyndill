import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { Button } from '../components/common/Button';
// PLACEHOLDER: Replace with final onboarding pet artist assets when delivered.
import {
  type PetSpecies,
} from '../components/common/PlaceholderPet';
import { SpritePet } from '../components/common/SpritePet';
import { Spinner } from '../components/common/Spinner';
import { api } from '../lib/api';
import {
  DEFAULT_TEMPLATE_IDS,
  HABIT_TEMPLATES,
  formatTemplateMeta,
  templateToHabitInput,
} from '../lib/habitTemplates';
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

type Step = 'consent' | 'tour' | 'species' | 'name' | 'habits';

const STEPS: { key: Step; label: string }[] = [
  { key: 'consent', label: 'Privacy' },
  { key: 'tour', label: 'How it works' },
  { key: 'species', label: 'Choose' },
  { key: 'name', label: 'Name' },
  { key: 'habits', label: 'Habits' },
];

const TOUR_CARDS = [
  {
    title: 'Complete habits',
    copy: 'Checking off today\'s habits gives XP, coins, streak progress, and a quick mood prompt.',
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

export function OnboardingPage() {
  const navigate = useNavigate();
  const { markPetInitialized } = useAuthContext();
  const { showToast } = useToastContext();

  const [step, setStep] = useState<Step>('consent');
  const [species, setSpecies] = useState<PetSpecies | null>(null);
  const [name, setName] = useState('');
  const [researchConsent, setResearchConsent] = useState(false);
  const [selectedStarterIds, setSelectedStarterIds] = useState<string[]>([...DEFAULT_TEMPLATE_IDS]);
  const [customHabitName, setCustomHabitName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputId = useId();
  const counterId = useId();

  const trimmedName = name.trim();
  const isNameValid = trimmedName.length >= 1 && trimmedName.length <= NAME_MAX;

  function toggleStarterHabit(id: string) {
    setSelectedStarterIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }

  async function handleComplete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!species || !isNameValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.post('/api/pet/initialize', { species, name: trimmedName });
      await api.patch('/api/user/profile', { research_consent: researchConsent });
      const selectedStarters = HABIT_TEMPLATES.filter((habit) => selectedStarterIds.includes(habit.id));
      const customName = customHabitName.trim();
      const starterRequests = selectedStarters.map((habit) =>
        api.post('/api/habits', templateToHabitInput(habit)),
      );
      if (customName) {
        starterRequests.push(
          api.post('/api/habits', {
            name: customName,
            description: 'Created during onboarding.',
            category: 'Wellness',
            frequency: 'daily',
          }),
        );
      }
      await Promise.all(starterRequests);
      markPetInitialized();
      navigate('/', { replace: true });
    } catch (err) {
      // ALREADY_INITIALIZED means the user already onboarded (rare race, or a
      // refresh after a successful POST). Treat as success and move on.
      if (
        err instanceof AxiosError &&
        (err.response?.data as { error?: { code?: string } } | undefined)?.error?.code ===
          'ALREADY_INITIALIZED'
      ) {
        markPetInitialized();
        navigate('/', { replace: true });
        return;
      }
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
        <section className="onboarding-step" aria-labelledby="onboarding-step-privacy-heading">
          <header className="onboarding-step__header">
            <h1 id="onboarding-step-privacy-heading">A clear start.</h1>
            <p className="text-muted">Kyndill records habit completions, reward events, focus sessions, and optional feedback so the platform can be evaluated during testing.</p>
          </header>

          <div className="onboarding-consent">
            <p>Evaluation data is anonymized before analysis. You can use Kyndill without adding identifying details to your profile, and you can withdraw from evaluation later without giving a reason.</p>
            <label className="consent-check">
              <input
                type="checkbox"
                checked={researchConsent}
                onChange={(event) => setResearchConsent(event.target.checked)}
              />
              <span>I understand anonymized interaction data and optional feedback may be used to evaluate Kyndill.</span>
            </label>
          </div>

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
            <p className="text-muted">The loop is simple: show up, earn progress, care for your companion, and use rewards to keep going.</p>
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
            <span>New users begin with 20 coins and two streak freezes. Care stats start full, while health depends on those stats and your streak momentum.</span>
          </div>

          <div className="onboarding-actions">
            <Button variant="ghost" type="button" onClick={() => setStep('consent')}>
              Back
            </Button>
            <Button variant="primary" size="lg" onClick={() => setStep('species')}>
              Choose companion
            </Button>
          </div>
        </section>
      ) : step === 'species' ? (
        <section className="onboarding-step" aria-labelledby="onboarding-step-1-heading">
          <header className="onboarding-step__header">
            <h1 id="onboarding-step-1-heading">Choose your companion.</h1>
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
                    'pet-option ' +
                    (species === option.species ? 'pet-option--selected' : '')
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
            <Button variant="ghost" type="button" onClick={() => setStep('tour')}>
              Back
            </Button>
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
        <section className="onboarding-step" aria-labelledby="onboarding-step-2-heading">
          <header className="onboarding-step__header">
            <h1 id="onboarding-step-2-heading">Name them.</h1>
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
                <label className="field__label" htmlFor={nameInputId}>
                  Their name
                </label>
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
                <Button variant="ghost" type="button" onClick={() => setStep('species')}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="lg"
                  type="submit"
                  disabled={!isNameValid}
                >
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
            <p className="text-muted">Pick ready-made habits, add your own, or do both. You can add these templates again later from the Habits page.</p>
          </header>

          <form className="onboarding-habits" onSubmit={handleComplete} noValidate>
            <div className="starter-habit-grid" aria-label="Starter habits">
              {HABIT_TEMPLATES.map((habit) => (
                <label key={habit.id} className={`starter-habit ${selectedStarterIds.includes(habit.id) ? 'starter-habit--selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selectedStarterIds.includes(habit.id)}
                    onChange={() => toggleStarterHabit(habit.id)}
                  />
                  <span className="starter-habit__body">
                    <strong>{habit.name}</strong>
                    <span>{habit.description}</span>
                    <em>{habit.category} - {formatTemplateMeta(habit)}</em>
                  </span>
                </label>
              ))}
            </div>

            <div className="onboarding-custom-habit">
              <label className="field" htmlFor="onboarding-custom-habit">
                <span className="field__label">Or create your first habit</span>
                <input
                  id="onboarding-custom-habit"
                  className="input"
                  type="text"
                  value={customHabitName}
                  onChange={(event) => setCustomHabitName(event.target.value.slice(0, 100))}
                  placeholder="Example: Stretch after waking"
                  autoComplete="off"
                />
              </label>
            </div>

            <div className="onboarding-actions">
              <Button variant="ghost" type="button" onClick={() => setStep('name')}>
                Back
              </Button>
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
