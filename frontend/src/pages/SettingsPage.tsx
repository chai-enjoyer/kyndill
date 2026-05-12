import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '../components/common/Button';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { Modal } from '../components/common/Modal';
import { useAuthContext } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import { useProfile } from '../hooks/useProfile';
import { extractMessage } from '../hooks/useSocial';
import { applyTheme, getStoredTheme, type Theme } from '../lib/utils';

const PREF_KEY = 'kyndill_notification_prefs';
type NotificationPrefs = {
  friendRequests: boolean;
  gifts: boolean;
  focusReminders: boolean;
};

export function SettingsPage() {
  const { profile, isLoading, changePassword, deleteAccount } = useProfile();
  const { logout } = useAuthContext();
  const { showToast } = useToastContext();
  const [theme, setTheme] = useState<Theme>(getStoredTheme());
  const [prefs, setPrefs] = useState<NotificationPrefs>(() => readPrefs());
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  }, [prefs]);

  async function submitPassword(event: FormEvent) {
    event.preventDefault();
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

  if (isLoading || !profile) {
    return <section className="page settings-page"><LoadingSkeleton width="100%" height={420} /></section>;
  }

  return (
    <section className="page settings-page">
      <header className="page__header"><div><p className="page__eyebrow">Preferences</p><h1>Settings</h1></div></header>
      <div className="settings-stack">
        <section className="settings-card">
          <h2>Appearance</h2>
          <label className="switch settings-switch">
            <input type="checkbox" checked={theme === 'dark'} onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')} />
            <span className="switch__track" aria-hidden="true" />
            <span className="switch__label">Dark mode</span>
          </label>
        </section>
        <section className="settings-card">
          <h2>Notifications</h2>
          {(['friendRequests', 'gifts', 'focusReminders'] as const).map((key) => (
            <label key={key} className="switch settings-switch">
              <input type="checkbox" checked={prefs[key]} onChange={(e) => setPrefs((prev) => ({ ...prev, [key]: e.target.checked }))} />
              <span className="switch__track" aria-hidden="true" />
              <span className="switch__label">{labelPref(key)}</span>
            </label>
          ))}
        </section>
        {profile.auth_provider === 'email' && (
          <section className="settings-card">
            <h2>Change password</h2>
            <form className="settings-form" onSubmit={submitPassword}>
              <input className="input" type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              <input className="input" type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <Button variant="primary" type="submit" disabled={passwordSaving || !currentPassword || newPassword.length < 8}>
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

function readPrefs(): NotificationPrefs {
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    if (raw) return { friendRequests: true, gifts: true, focusReminders: true, ...JSON.parse(raw) };
  } catch {
    // localStorage can be unavailable in private contexts.
  }
  return { friendRequests: true, gifts: true, focusReminders: true };
}

function labelPref(key: 'friendRequests' | 'gifts' | 'focusReminders'): string {
  return {
    friendRequests: 'Friend requests',
    gifts: 'Gifts',
    focusReminders: 'Focus reminders',
  }[key];
}
