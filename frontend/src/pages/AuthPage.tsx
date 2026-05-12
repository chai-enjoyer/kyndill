import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { NavLink } from 'react-router-dom';
import { AxiosError } from 'axios';
import { Button } from '../components/common/Button';
import { CandleIllustration } from '../components/common/CandleIllustration';
import { Spinner } from '../components/common/Spinner';
import { useAuthContext } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import { isGoogleConfigured, renderGoogleButton } from '../lib/google';

interface AuthPageProps {
  mode: 'login' | 'register';
}

type FieldName = 'display_name' | 'email' | 'password';
type FieldErrors = Partial<Record<FieldName, string>>;

const EMAIL_PATTERN = /.+@.+\..+/;

export function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === 'register';
  const { login, register } = useAuthContext();
  const { showToast } = useToastContext();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, [mode]);

  // Reset errors when switching tabs so a previous attempt doesn't bleed across.
  useEffect(() => {
    setErrors({});
  }, [mode]);

  const ids = {
    displayName: useId(),
    email: useId(),
    password: useId(),
  };

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (isRegister) {
      const trimmed = displayName.trim();
      if (trimmed.length < 2) next.display_name = 'At least 2 characters.';
      else if (trimmed.length > 60) next.display_name = 'Keep it under 60 characters.';
    }
    if (!email) next.email = 'Email is required.';
    else if (!EMAIL_PATTERN.test(email)) next.email = "That email doesn't look right.";
    if (!password) next.password = 'Password is required.';
    else if (isRegister && password.length < 8) next.password = 'At least 8 characters.';
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const next = validate();
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      if (isRegister) {
        await register(email.trim(), password, displayName.trim());
      } else {
        await login(email.trim(), password);
      }
      // No explicit navigate: AuthContext's hydrate effect updates token +
      // petInitialized, then <PublicOnly> redirects to /onboarding or /.
    } catch (err) {
      showToast(extractMessage(err, isRegister), 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page" data-mode={mode}>
      <aside className="auth-illustration" aria-hidden="true">
        <CandleIllustration className="auth-illustration__svg" />
        <div className="auth-illustration__caption">
          <span className="auth-illustration__wordmark">Kyndill</span>
          <p>Small flames, kept alive daily.</p>
        </div>
      </aside>

      <section className="auth-form-pane">
        <div className="auth-form-pane__inner">
          <nav className="auth-tabs" aria-label="Account">
            <NavLink
              to="/login"
              className={({ isActive }) =>
                ['auth-tabs__tab', isActive ? 'auth-tabs__tab--active' : null]
                  .filter(Boolean)
                  .join(' ')
              }
            >
              Sign in
            </NavLink>
            <NavLink
              to="/register"
              className={({ isActive }) =>
                ['auth-tabs__tab', isActive ? 'auth-tabs__tab--active' : null]
                  .filter(Boolean)
                  .join(' ')
              }
            >
              Create account
            </NavLink>
          </nav>

          <header className="auth-form-pane__header">
            <h1>{isRegister ? 'Light your first flame.' : 'Welcome back.'}</h1>
            <p className="text-muted">
              {isRegister
                ? 'Two minutes to set up. One habit to start.'
                : 'Your habits are waiting.'}
            </p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {isRegister && (
              <div className={`field ${errors.display_name ? 'field--error' : ''}`}>
                <label className="field__label" htmlFor={ids.displayName}>
                  Display name
                </label>
                <input
                  ref={firstFieldRef}
                  id={ids.displayName}
                  className="input"
                  type="text"
                  autoComplete="name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onBlur={() => setErrors((prev) => ({ ...prev, display_name: validate().display_name }))}
                  aria-describedby={errors.display_name ? `${ids.displayName}-error` : undefined}
                  aria-invalid={Boolean(errors.display_name) || undefined}
                  maxLength={60}
                  required
                />
                {errors.display_name && (
                  <p className="field__error" id={`${ids.displayName}-error`} role="alert">
                    {errors.display_name}
                  </p>
                )}
              </div>
            )}

            <div className={`field ${errors.email ? 'field--error' : ''}`}>
              <label className="field__label" htmlFor={ids.email}>
                Email
              </label>
              <input
                ref={isRegister ? undefined : firstFieldRef}
                id={ids.email}
                className="input"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setErrors((prev) => ({ ...prev, email: validate().email }))}
                aria-describedby={errors.email ? `${ids.email}-error` : undefined}
                aria-invalid={Boolean(errors.email) || undefined}
                required
              />
              {errors.email && (
                <p className="field__error" id={`${ids.email}-error`} role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div className={`field ${errors.password ? 'field--error' : ''}`}>
              <label className="field__label" htmlFor={ids.password}>
                Password
              </label>
              <input
                id={ids.password}
                className="input"
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setErrors((prev) => ({ ...prev, password: validate().password }))}
                aria-describedby={errors.password ? `${ids.password}-error` : undefined}
                aria-invalid={Boolean(errors.password) || undefined}
                required
                minLength={isRegister ? 8 : undefined}
              />
              {errors.password && (
                <p className="field__error" id={`${ids.password}-error`} role="alert">
                  {errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              aria-busy={isSubmitting || undefined}
              className="auth-form__submit"
            >
              {isSubmitting ? <Spinner /> : null}
              {isRegister ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          <GoogleSection mode={mode} />
        </div>
      </section>
    </main>
  );
}

function GoogleSection({ mode }: { mode: 'login' | 'register' }) {
  const { loginWithGoogle } = useAuthContext();
  const { showToast } = useToastContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'configured' | 'unavailable'>('idle');

  useEffect(() => {
    if (!isGoogleConfigured()) {
      setStatus('unavailable');
      return;
    }
    if (!containerRef.current) return;

    let canceled = false;
    renderGoogleButton(
      containerRef.current,
      async (credential) => {
        try {
          await loginWithGoogle(credential);
        } catch (err) {
          showToast(extractMessage(err, mode === 'register'), 'error');
        }
      },
      { text: mode === 'register' ? 'signup_with' : 'signin_with' },
    )
      .then(() => {
        if (!canceled) setStatus('configured');
      })
      .catch(() => {
        if (!canceled) setStatus('unavailable');
      });

    return () => {
      canceled = true;
    };
  }, [loginWithGoogle, showToast, mode]);

  if (status === 'unavailable') return null;

  return (
    <div className="auth-google">
      <div className="auth-divider" role="separator" aria-orientation="horizontal">
        <span>or</span>
      </div>
      <div ref={containerRef} className="auth-google__button" />
    </div>
  );
}

function extractMessage(err: unknown, isRegister: boolean): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as
      | { error?: { code?: string; message?: string } }
      | undefined;
    const code = data?.error?.code;
    const message = data?.error?.message;
    if (code === 'INVALID_CREDENTIALS') return 'That email and password do not match.';
    if (code === 'EMAIL_TAKEN') return 'An account with this email already exists.';
    if (code === 'INVALID_GOOGLE_TOKEN') return 'Google sign-in could not be verified.';
    if (code === 'VALIDATION_FAILED') return 'Please check the form and try again.';
    if (message) return message;
  }
  return isRegister
    ? 'Something went wrong creating your account. Please try again.'
    : 'Something went wrong signing in. Please try again.';
}
