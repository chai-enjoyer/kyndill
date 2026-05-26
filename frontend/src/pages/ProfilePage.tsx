import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AnimatedValue } from '../components/common/AnimatedValue';
import { Button } from '../components/common/Button';
import { FlameIcon } from '../components/common/FlameIcon';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { JournalSection } from '../components/profile/JournalSection';
import { useAuthContext } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import { useProfile } from '../hooks/useProfile';
import { extractMessage } from '../hooks/useSocial';

type ProfileTab = 'account' | 'journal';

export function ProfilePage() {
  const { profile, isLoading, save } = useProfile();
  const { mergeUser, logout } = useAuthContext();
  const { showToast } = useToastContext();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('private');
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [tab, setTab] = useState<ProfileTab>('account');
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name);
    setUsername(profile.username);
    setBio(profile.bio ?? '');
    setVisibility(profile.visibility);
  }, [profile]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await save({
        display_name: displayName,
        username,
        bio,
        visibility,
      });
      mergeUser({
        display_name: updated.display_name,
        username: updated.username,
        visibility: updated.visibility,
      });
      showToast('Profile saved.', 'success');
    } catch (err) {
      showToast(extractMessage(err, 'Could not save profile.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || avatarSaving) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please choose an image file.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Avatar image must be 5 MB or smaller.', 'error');
      return;
    }

    setAvatarSaving(true);
    try {
      const avatarUrl = await resizeAvatar(file);
      const updated = await save({ avatar_url: avatarUrl });
      mergeUser({ avatar_url: updated.avatar_url });
      showToast('Avatar updated.', 'success');
    } catch (err) {
      showToast(extractMessage(err, 'Could not upload avatar.'), 'error');
    } finally {
      setAvatarSaving(false);
    }
  }

  async function removeAvatar() {
    setAvatarSaving(true);
    try {
      const updated = await save({ avatar_url: null });
      mergeUser({ avatar_url: updated.avatar_url });
      showToast('Avatar removed.', 'success');
    } catch (err) {
      showToast(extractMessage(err, 'Could not remove avatar.'), 'error');
    } finally {
      setAvatarSaving(false);
    }
  }

  if (isLoading || !profile) {
    return <section className="page profile-page"><LoadingSkeleton width="100%" height={420} /></section>;
  }

  return (
    <section className="page profile-page">
      <header className="page__header">
        <div><p className="page__eyebrow">Account</p><h1>Profile</h1></div>
        <div className="profile-page__actions">
          <Link to="/progress" className="btn btn--secondary">Progress</Link>
          <Link to="/settings" className="btn btn--secondary">Settings</Link>
          <Button variant="secondary" type="button" onClick={logout}>Sign out</Button>
        </div>
      </header>
      <nav className="profile-tabs" role="tablist" aria-label="Profile sections">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'account'}
          className={`profile-tab${tab === 'account' ? ' is-active' : ''}`}
          onClick={() => setTab('account')}
        >
          Account
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'journal'}
          className={`profile-tab${tab === 'journal' ? ' is-active' : ''}`}
          onClick={() => setTab('journal')}
        >
          Journal
        </button>
      </nav>
      {tab === 'journal' ? (
        <JournalSection />
      ) : (
      <div className="profile-layout">
        <form className="profile-card" onSubmit={submit}>
          <div className="profile-avatar-row">
            <span className="avatar-circle avatar-circle--lg">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" />
              ) : (
                displayName.slice(0, 1).toUpperCase()
              )}
            </span>
            <div className="profile-avatar-actions">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="visually-hidden"
                onChange={handleAvatarChange}
              />
              <Button
                variant="secondary"
                type="button"
                disabled={avatarSaving}
                onClick={() => avatarInputRef.current?.click()}
              >
                {avatarSaving ? 'Uploading...' : 'Upload'}
              </Button>
              {profile.avatar_url && (
                <Button variant="ghost" type="button" disabled={avatarSaving} onClick={removeAvatar}>
                  Remove
                </Button>
              )}
            </div>
          </div>
          <div className="field"><label className="field__label">Display name</label><input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
          <div className="field"><label className="field__label">Username</label><input className="input" value={username} onChange={(e) => setUsername(e.target.value)} /></div>
          <div className="field"><label className="field__label">Bio</label><textarea className="textarea" maxLength={280} value={bio} onChange={(e) => setBio(e.target.value)} /></div>
          <div className="field">
            <label className="field__label">Visibility</label>
            <select className="input" value={visibility} onChange={(e) => setVisibility(e.target.value as typeof visibility)}>
              <option value="public">Public</option>
              <option value="friends">Friends Only</option>
              <option value="private">Private</option>
            </select>
          </div>
          <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </form>
        <aside className="profile-stats">
          <Stat label="Level" value={profile.level} />
          <Stat label="Total habits" value={profile.total_habits} />
          <Stat label="Longest streak" value={profile.streak_longest} tone="streak" />
          <Stat label="Focus time" value={`${profile.total_focus_minutes}m`} />
        </aside>
      </div>
      )}
    </section>
  );
}

async function resizeAvatar(file: File): Promise<string> {
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(imageUrl);
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is unavailable');

    const side = Math.min(image.naturalWidth, image.naturalHeight);
    const sx = Math.max(0, (image.naturalWidth - side) / 2);
    const sy = Math.max(0, (image.naturalHeight - side) / 2);
    ctx.drawImage(image, sx, sy, side, side, 0, 0, size, size);
    return canvas.toDataURL('image/webp', 0.86);
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not read image'));
    image.src = src;
  });
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: 'streak' }) {
  return (
    <div className="profile-stat">
      <span>{label}</span>
      <strong className={tone === 'streak' ? 'profile-stat__streak' : undefined}>
        {tone === 'streak' && <FlameIcon size={18} />}
        <AnimatedValue value={value} />
      </strong>
    </div>
  );
}
