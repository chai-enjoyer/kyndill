import { useEffect, useId, useRef, useState, type FormEvent, type MouseEvent } from 'react';
import { NavLink } from 'react-router-dom';
import { AxiosError } from 'axios';
import { Button } from '../components/common/Button';
import { CandleIllustration } from '../components/common/CandleIllustration';
import { PasswordRequirements } from '../components/common/PasswordRequirements';
import { Spinner } from '../components/common/Spinner';
import { useAuthContext } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import {
  getEmailValidationMessage,
  getPasswordValidationMessage,
  normalizeEmail,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '../lib/credentials';
import { isGoogleConfigured, renderGoogleButton } from '../lib/google';

interface AuthPageProps {
  mode: 'login' | 'register';
}

type FieldName = 'display_name' | 'email' | 'password' | 'password_confirmation';
type FieldErrors = Partial<Record<FieldName, string>>;

function keepTabClickFromBlurringField(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

export function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === 'register';
  const { login, register } = useAuthContext();
  const { showToast } = useToastContext();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
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
    passwordConfirmation: useId(),
  };
  const passwordRequirementsId = `${ids.password}-requirements`;

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (isRegister) {
      const trimmed = displayName.trim();
      if (trimmed.length < 2) next.display_name = 'At least 2 characters.';
      else if (trimmed.length > 60) next.display_name = 'Keep it under 60 characters.';
    }
    const emailIssue = getEmailValidationMessage(email);
    if (emailIssue) next.email = emailIssue;
    if (!password) next.password = 'Password is required.';
    else if (isRegister) {
      const passwordIssue = getPasswordValidationMessage(password);
      if (passwordIssue) next.password = passwordIssue;
    }
    if (isRegister) {
      if (!passwordConfirmation) next.password_confirmation = 'Repeat your password.';
      else if (password && passwordConfirmation !== password) {
        next.password_confirmation = 'Passwords do not match.';
      }
    }
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
        await register(normalizeEmail(email), password, passwordConfirmation, displayName.trim());
      } else {
        await login(normalizeEmail(email), password);
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
              onMouseDown={keepTabClickFromBlurringField}
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
              onMouseDown={keepTabClickFromBlurringField}
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
                onBlur={() => {
                  setEmail(normalizeEmail(email));
                  setErrors((prev) => ({ ...prev, email: validate().email }));
                }}
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
                aria-describedby={[
                  errors.password ? `${ids.password}-error` : null,
                  isRegister ? passwordRequirementsId : null,
                ]
                  .filter(Boolean)
                  .join(' ') || undefined}
                aria-invalid={Boolean(errors.password) || undefined}
                required
                minLength={isRegister ? PASSWORD_MIN_LENGTH : undefined}
                maxLength={isRegister ? PASSWORD_MAX_LENGTH : undefined}
              />
              {errors.password && (
                <p className="field__error" id={`${ids.password}-error`} role="alert">
                  {errors.password}
                </p>
              )}
              {isRegister && <PasswordRequirements id={passwordRequirementsId} password={password} />}
            </div>

            {isRegister && (
              <div className={`field ${errors.password_confirmation ? 'field--error' : ''}`}>
                <label className="field__label" htmlFor={ids.passwordConfirmation}>
                  Repeat password
                </label>
                <input
                  id={ids.passwordConfirmation}
                  className="input"
                  type="password"
                  autoComplete="new-password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  onBlur={() =>
                    setErrors((prev) => ({
                      ...prev,
                      password_confirmation: validate().password_confirmation,
                    }))
                  }
                  aria-describedby={
                    errors.password_confirmation ? `${ids.passwordConfirmation}-error` : undefined
                  }
                  aria-invalid={Boolean(errors.password_confirmation) || undefined}
                  minLength={PASSWORD_MIN_LENGTH}
                  maxLength={PASSWORD_MAX_LENGTH}
                  required
                />
                {errors.password_confirmation && (
                  <p className="field__error" id={`${ids.passwordConfirmation}-error`} role="alert">
                    {errors.password_confirmation}
                  </p>
                )}
              </div>
            )}

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
  const [status, setStatus] = useState<'loading' | 'configured' | 'unconfigured' | 'error'>('loading');

  useEffect(() => {
    if (!isGoogleConfigured()) {
      setStatus('unconfigured');
      return;
    }
    if (!containerRef.current) return;

    let canceled = false;
    setStatus('loading');
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
        if (!canceled) setStatus('error');
      });

    return () => {
      canceled = true;
      if (containerRef.current) containerRef.current.innerHTML = '';
      window.google?.accounts?.id.cancel();
    };
  }, [loginWithGoogle, showToast, mode]);

  return (
    <div className="auth-google">
      <div className="auth-divider" role="separator" aria-orientation="horizontal">
        <span>or</span>
      </div>
      {status === 'unconfigured' ? (
        <button type="button" className="auth-google__fallback" disabled>
          Google sign-in needs setup
        </button>
      ) : status === 'error' ? (
        <p className="auth-google__status" role="status">
          Google sign-in could not load.
        </p>
      ) : (
        <div ref={containerRef} className="auth-google__button" aria-busy={status === 'loading'} />
      )}
    </div>
  );
}

function extractMessage(err: unknown, isRegister: boolean): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as
      | { error?: { code?: string; message?: string; issues?: Array<{ message?: string }> } }
      | undefined;
    const code = data?.error?.code;
    const message = data?.error?.message;
    const firstIssue = data?.error?.issues?.find((issue) => issue.message)?.message;
    if (code === 'INVALID_CREDENTIALS') return 'That email and password do not match.';
    if (code === 'EMAIL_TAKEN') return 'An account with this email already exists.';
    if (code === 'INVALID_GOOGLE_TOKEN') return 'Google sign-in could not be verified.';
    if (code === 'VALIDATION_FAILED') return firstIssue ?? 'Please check the form and try again.';
    if (message) return message;
  }
  return isRegister
    ? 'Something went wrong creating your account. Please try again.'
    : 'Something went wrong signing in. Please try again.';
}
