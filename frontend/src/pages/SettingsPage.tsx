import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '../components/ui/Button';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { Modal } from '../components/ui/Modal';
import { PasswordRequirements } from '../components/ui/PasswordRequirements';
import { useAuthContext } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import { useProfile } from '../hooks/useProfile';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { extractMessage } from '../hooks/useSocial';
import { api } from '../lib/api';
import { getPasswordValidationMessage, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../lib/credentials';
import { applyTheme, getStoredTheme, isDarkActive, type Theme } from '../lib/utils';

type NotificationPrefs = {
  friendRequests: boolean;
  gifts: boolean;
  focusReminders: boolean;
  dailyReminder: boolean;
  moodPing: boolean;
};

type PasswordFieldErrors = {
  current?: string;
  next?: string;
};

const DEFAULT_PREFS: NotificationPrefs = {
  friendRequests: true,
  gifts: true,
  focusReminders: true,
  dailyReminder: true,
  moodPing: false,
};

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

const FAQ_ITEMS = [
  {
    question: 'How does pet health work?',
    answer: 'Health combines care stats and streak momentum. There is no guaranteed base, so low hunger, energy, cleanliness, or happiness can pull health down even if you have progress.',
  },
  {
    question: 'Do pet stats change over time?',
    answer: 'Yes. Hunger, energy, cleanliness, and happiness decay a little each day you return, which gives consumables and daily habit check-ins a purpose.',
  },
  {
    question: 'What happens when I complete a habit?',
    answer: 'You get XP, coins, streak progress, pet stat changes, and sometimes an item drop. Early habits now pay enough for useful consumables quickly, while longer streaks add coin bonuses.',
  },
  {
    question: 'How do I afford shop items?',
    answer: 'New users start with 20 coins. Small consumables cost only a few coins, common cosmetics are reachable after several habit completions, and focus sessions are a steady way to earn extra coins.',
  },
  {
    question: 'What stays private?',
    answer: 'Your level is public so friends can recognize progress. Streak and total habit history still follow your profile visibility setting.',
  },
  {
    question: 'What are streak freezes?',
    answer: 'A streak freeze protects your streak after a missed day. New users start with two, and you can hold up to three.',
  },
] as const;

export function SettingsPage() {
  const { profile, isLoading, save, changePassword, deleteAccount } = useProfile();
  const { logout, mergeUser } = useAuthContext();
  const { showToast } = useToastContext();
  const push = usePushNotifications();
  const [theme, setTheme] = useState<Theme>(getStoredTheme());
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [reminderHour, setReminderHour] = useState<number | null>(19);
  const [researchConsent, setResearchConsent] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<PasswordFieldErrors>({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setPrefs({ ...DEFAULT_PREFS, ...profile.notification_prefs });
    setResearchConsent(profile.research_consent);
    setReminderHour(profile.reminder_hour);
  }, [profile]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  async function submitPassword(event: FormEvent) {
    event.preventDefault();
    const passwordIssue = getPasswordValidationMessage(newPassword);
    if (!currentPassword) {
      setPasswordErrors({ current: 'Current password is required.' });
      return;
    }
    if (passwordIssue) {
      setPasswordErrors({ next: passwordIssue });
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordErrors({ next: 'Choose a password different from your current one.' });
      return;
    }

    setPasswordErrors({});
    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      showToast('Password changed.', 'success');
    } catch (err) {
      showToast(extractMessage(err, 'Could not change password.'), 'error');
    } finally {
      setPasswordSaving(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await deleteAccount();
      logout();
    } catch (err) {
      showToast(extractMessage(err, 'Could not delete account.'), 'error');
      setDeleting(false);
    }
  }

  async function submitFeedback(event: FormEvent) {
    event.preventDefault();
    if (!feedbackNote.trim()) return;
    setFeedbackSaving(true);
    try {
      await api.post('/api/feedback', {
        context: 'general_feedback',
        note: feedbackNote.trim(),
      });
      setFeedbackNote('');
      showToast('Thanks — we read every one.', 'success');
    } catch (err) {
      showToast(extractMessage(err, 'Could not save feedback.'), 'error');
    } finally {
      setFeedbackSaving(false);
    }
  }

  async function updateNotificationPref(key: keyof NotificationPrefs, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    try {
      await save({ notification_prefs: next });
    } catch (err) {
      setPrefs(prefs);
      showToast(extractMessage(err, 'Could not save notification preference.'), 'error');
    }
  }

  async function updateReminderHour(value: number | null) {
    const previous = reminderHour;
    setReminderHour(value);
    try {
      await save({
        reminder_hour: value,
        reminder_timezone: detectTimezone(),
      });
    } catch (err) {
      setReminderHour(previous);
      showToast(extractMessage(err, 'Could not save reminder time.'), 'error');
    }
  }

  async function updateResearchConsent(value: boolean) {
    setResearchConsent(value);
    try {
      /* Text-length-only collection isn't a meaningful intermediate
       * state (the analytical value of 'they wrote 80 chars' is near
       * zero), so the single research toggle now governs both flags
       * together: opting in shares the actual text, opting out turns
       * everything off. */
      const updated = await save({
        research_consent: value,
        share_text_consent: value,
      });
      mergeUser({ research_consent: updated.research_consent });
    } catch (err) {
      setResearchConsent(!value);
      showToast(extractMessage(err, 'Could not save consent setting.'), 'error');
    }
  }

  async function enablePushNotifications() {
    try {
      await push.enable();
      showToast('Push enabled on this device.', 'success');
    } catch (err) {
      showToast(extractMessage(err, 'Could not enable push notifications.'), 'error');
    }
  }

  async function disablePushNotifications() {
    try {
      await push.disable();
      showToast('Push turned off here.', 'success');
    } catch (err) {
      showToast(extractMessage(err, 'Could not disable push notifications.'), 'error');
    }
  }

  async function sendTestPush() {
    try {
      await push.sendTest();
      showToast('Test sent — watch for it.', 'success');
    } catch (err) {
      showToast(extractMessage(err, 'Could not send a test notification.'), 'error');
    }
  }

  if (isLoading || !profile) {
    return <section className="page settings-page"><LoadingSkeleton width="100%" height={420} /></section>;
  }

  const passwordRequirementsId = 'settings-new-password-requirements';
  const currentPasswordErrorId = 'settings-current-password-error';
  const newPasswordErrorId = 'settings-new-password-error';
  const passwordIssue = getPasswordValidationMessage(newPassword);
  const canSubmitPassword = Boolean(currentPassword) && !passwordIssue;

  return (
    <section className="page settings-page">
      <header className="page__header"><div><p className="page__eyebrow">Preferences</p><h1>Settings</h1></div></header>
      <div className="settings-stack">
        <div className="settings-stack__main">
          <section className="settings-card settings-card--notifications">
            <h2>Notifications</h2>
            {(['friendRequests', 'gifts', 'focusReminders', 'dailyReminder', 'moodPing'] as const).map((key) => (
              <label key={key} className="switch settings-switch">
                <input
                  type="checkbox"
                  checked={prefs[key]}
                  onChange={(e) => updateNotificationPref(key, e.target.checked)}
                />
                <span className="switch__track" aria-hidden="true" />
                <span className="switch__label">{labelPref(key)}</span>
              </label>
            ))}
            {prefs.moodPing && (
              <p className="text-muted settings-card__hint">
                Weekly mood check-ins arrive on Monday mornings and start a week after sign-up. If
                push is enabled, they also come through as a quiet notification.
              </p>
            )}
            {prefs.dailyReminder && (
              <div className="reminder-time">
                <div>
                  <h3>Reminder time</h3>
                  <p className="text-muted">
                    {reminderHour === null
                      ? 'Off. Pick any hour and Kyndill will send a quiet nudge if habits are still open.'
                      : `Sent at ${formatHourLabel(reminderHour)} in your local time, only if habits are still pending.`}
                  </p>
                </div>
                <div className="reminder-time__controls">
                  <select
                    className="input reminder-time__select"
                    aria-label="Reminder time"
                    value={reminderHour ?? ''}
                    onChange={(e) =>
                      updateReminderHour(e.target.value === '' ? null : Number(e.target.value))
                    }
                  >
                    <option value="">Off</option>
                    {Array.from({ length: 24 }, (_, hour) => (
                      <option key={hour} value={hour}>
                        {formatHourLabel(hour)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            <div className="push-settings">
              <div>
                <h3>Browser push</h3>
                <p className="text-muted">{pushStatus(push)}</p>
                {push.error && <p className="field__error">{push.error}</p>}
              </div>
              <div className="push-settings__actions">
                {push.isSubscribed ? (
                  <>
                    <Button
                      variant="secondary"
                      type="button"
                      disabled={push.isSaving}
                      onClick={sendTestPush}
                    >
                      Send test
                    </Button>
                    <Button
                      variant="secondary"
                      type="button"
                      disabled={push.isSaving}
                      onClick={disablePushNotifications}
                    >
                      Disable
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    type="button"
                    disabled={
                      push.isLoading ||
                      push.isSaving ||
                      !push.supported ||
                      !push.isConfigured ||
                      push.permission === 'denied'
                    }
                    onClick={enablePushNotifications}
                  >
                    {push.isSaving ? 'Enabling...' : 'Enable push'}
                  </Button>
                )}
              </div>
            </div>
          </section>
          <section className="settings-card settings-card--feedback">
            <h2>Research and feedback</h2>
            <p className="text-muted">
              Kyndill is in research mode. With your consent we store anonymized habit,
              focus, pet, social, and navigation events to evaluate engagement and motivational
              impact. Identifying fields (email, name, username, avatar) are never included in
              exports.
            </p>
            <label className="switch settings-switch">
              <input type="checkbox" checked={researchConsent} onChange={(e) => updateResearchConsent(e.target.checked)} />
              <span className="switch__track" aria-hidden="true" />
              <span className="switch__label">Participate in anonymized evaluation</span>
            </label>
            <p className="text-muted settings-card__hint">
              {researchConsent
                ? 'Habit names, reflection notes, and feedback you submit from now on are stored with your other anonymized events.'
                : 'Turning evaluation off stops new data collection immediately. Existing rows stay until you delete the account.'}
            </p>
            <form className="settings-feedback" onSubmit={submitFeedback}>
              <textarea className="textarea" maxLength={1000} placeholder="Share feedback about Kyndill" value={feedbackNote} onChange={(e) => setFeedbackNote(e.target.value)} />
              <Button variant="secondary" type="submit" disabled={feedbackSaving || !feedbackNote.trim()}>
                {feedbackSaving ? 'Sending...' : 'Send feedback'}
              </Button>
            </form>
          </section>
          <section className="settings-card settings-card--faq">
            <h2>FAQ</h2>
            <div className="faq-list">
              {FAQ_ITEMS.map((item) => (
                <details key={item.question} className="faq-item">
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
        <div className="settings-stack__side">
          <section className="settings-card">
            <h2>Appearance</h2>
            <label className="switch settings-switch">
              <input type="checkbox" checked={isDarkActive(theme)} onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')} />
              <span className="switch__track" aria-hidden="true" />
              <span className="switch__label">Dark mode</span>
            </label>
          </section>
          <section className="settings-card">
            <h2>Account</h2>
            <p className="text-muted">Signed in as {profile.email}.</p>
            <Button variant="secondary" type="button" onClick={logout}>Sign out</Button>
          </section>
          {profile.auth_provider === 'email' && (
            <section className="settings-card settings-card--password">
              <h2>Change password</h2>
              <form className="settings-form settings-form--password" onSubmit={submitPassword} noValidate>
                <div className={`field ${passwordErrors.current ? 'field--error' : ''}`}>
                  <label className="field__label" htmlFor="settings-current-password">Current password</label>
                  <input
                    id="settings-current-password"
                    className="input"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setPasswordErrors({});
                    }}
                    aria-describedby={passwordErrors.current ? currentPasswordErrorId : undefined}
                    aria-invalid={Boolean(passwordErrors.current) || undefined}
                    required
                  />
                  {passwordErrors.current && (
                    <p className="field__error" id={currentPasswordErrorId} role="alert">
                      {passwordErrors.current}
                    </p>
                  )}
                </div>
                <div className={`field ${passwordErrors.next ? 'field--error' : ''}`}>
                  <label className="field__label" htmlFor="settings-new-password">New password</label>
                  <input
                    id="settings-new-password"
                    className="input"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordErrors({});
                    }}
                    aria-describedby={`${passwordRequirementsId}${passwordErrors.next ? ` ${newPasswordErrorId}` : ''}`}
                    aria-invalid={Boolean(passwordErrors.next) || undefined}
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    required
                  />
                  <PasswordRequirements id={passwordRequirementsId} password={newPassword} />
                  {passwordErrors.next && (
                    <p className="field__error" id={newPasswordErrorId} role="alert">
                      {passwordErrors.next}
                    </p>
                  )}
                </div>
                <Button variant="primary" type="submit" disabled={passwordSaving || !canSubmitPassword}>
                  {passwordSaving ? 'Changing...' : 'Change password'}
                </Button>
              </form>
            </section>
          )}
          <section className="settings-card settings-card--danger">
            <h2>Danger zone</h2>
            <p className="text-muted">Delete your account and all Kyndill data.</p>
            <Button variant="secondary" onClick={() => setDeleteOpen(true)}>Delete Account</Button>
          </section>
        </div>
      </div>
      {deleteOpen && (
        <Modal isOpen onClose={() => setDeleteOpen(false)} title="Delete account">
          <p className="confirm-copy">Type DELETE to permanently delete your account.</p>
          <input className="input danger-input" value={deleteText} onChange={(e) => setDeleteText(e.target.value)} />
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="primary" disabled={deleting || deleteText !== 'DELETE'} onClick={confirmDelete}>
              {deleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}

function labelPref(key: 'friendRequests' | 'gifts' | 'focusReminders' | 'dailyReminder' | 'moodPing'): string {
  return {
    friendRequests: 'Friend requests',
    gifts: 'Gifts',
    focusReminders: 'Focus reminders',
    dailyReminder: 'Daily habit reminder',
    moodPing: 'Weekly mood check-in',
  }[key];
}

function formatHourLabel(hour: number): string {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  try {
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
  } catch {
    return `${hour.toString().padStart(2, '0')}:00`;
  }
}

function pushStatus(push: ReturnType<typeof usePushNotifications>): string {
  // iOS Safari only exposes the push APIs inside an installed PWA, so the
  // generic "not supported" message would mislead - surface the real fix first.
  if (push.requiresPwa)
    return 'On iOS, add Kyndill to your Home Screen first to receive push notifications.';
  if (!push.supported) return 'This browser does not support Web Push notifications.';
  if (!push.isConfigured) return 'Server push keys are not configured yet.';
  if (push.permission === 'denied') return 'Notifications are blocked in browser settings.';
  if (push.isSubscribed) return 'Enabled for this browser.';
  if (push.permission === 'granted') return 'Permission is granted, but this browser is not subscribed.';
  return 'Get reward, gift, and friend updates even when Kyndill is not open.';
}
