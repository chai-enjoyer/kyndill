import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import { Button } from '../components/common/Button';
// PLACEHOLDER: Replace with final onboarding pet sprites when delivered.
import {
  PlaceholderPet,
  type PetSpecies,
} from '../components/common/PlaceholderPet';
import { Spinner } from '../components/common/Spinner';
import { api } from '../lib/api';
import { useAuthContext } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';

const NAME_MAX = 20;

interface SpeciesOption {
  species: PetSpecies;
  label: string;
  hint: string;
}

const SPECIES_OPTIONS: SpeciesOption[] = [
  { species: 'blob', label: 'Blob', hint: 'Soft, easy to please.' },
  { species: 'cube', label: 'Cube', hint: 'Steady, methodical.' },
  { species: 'sphere', label: 'Sphere', hint: 'Curious, social.' },
  { species: 'pyramid', label: 'Pyramid', hint: 'Quiet, focused.' },
];

type Step = 'species' | 'name';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { markPetInitialized } = useAuthContext();
  const { showToast } = useToastContext();

  const [step, setStep] = useState<Step>('species');
  const [species, setSpecies] = useState<PetSpecies | null>(null);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nameInputId = useId();
  const counterId = useId();

  const trimmedName = name.trim();
  const isNameValid = trimmedName.length >= 1 && trimmedName.length <= NAME_MAX;

  async function handleComplete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!species || !isNameValid || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.post('/api/pet/initialize', { species, name: trimmedName });
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
        <li className={`onboarding-steps__step ${step === 'species' ? 'is-current' : 'is-done'}`}>
          <span className="onboarding-steps__num" aria-hidden="true">1</span>
          <span>Choose</span>
        </li>
        <li className={`onboarding-steps__step ${step === 'name' ? 'is-current' : ''}`}>
          <span className="onboarding-steps__num" aria-hidden="true">2</span>
          <span>Name</span>
        </li>
      </ol>

      {step === 'species' ? (
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
                    <PlaceholderPet species={option.species} mood="happy" size={120} />
                  </span>
                  <span className="pet-option__label">{option.label}</span>
                  <span className="pet-option__hint text-muted">{option.hint}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="onboarding-actions">
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
      ) : (
        <section className="onboarding-step" aria-labelledby="onboarding-step-2-heading">
          <header className="onboarding-step__header">
            <h1 id="onboarding-step-2-heading">Name them.</h1>
            <p className="text-muted">Anything you will say tenderly.</p>
          </header>

          <div className="onboarding-name">
            <figure className="onboarding-name__preview">
              {species && (
                <PlaceholderPet species={species} mood="happy" size={180} className="pet-breathing" />
              )}
              <figcaption className="onboarding-name__caption">
                {trimmedName.length > 0 ? trimmedName : 'unnamed'}
              </figcaption>
            </figure>

            <form className="onboarding-name__form" onSubmit={handleComplete} noValidate>
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
                  disabled={!isNameValid || isSubmitting}
                  aria-busy={isSubmitting || undefined}
                >
                  {isSubmitting ? <Spinner /> : null}
                  Light the flame
                </Button>
              </div>
            </form>
          </div>
        </section>
      )}
    </main>
  );
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
