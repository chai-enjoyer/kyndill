import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '../components/common/Button';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { useAuthContext } from '../context/AuthContext';
import { useToastContext } from '../context/ToastContext';
import { useProfile } from '../hooks/useProfile';
import { extractMessage } from '../hooks/useSocial';

export function ProfilePage() {
  const { profile, isLoading, save } = useProfile();
  const { mergeUser } = useAuthContext();
  const { showToast } = useToastContext();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('private');

  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name);
    setUsername(profile.username);
    setBio(profile.bio ?? '');
    setVisibility(profile.visibility);
  }, [profile]);

  async function submit(event: FormEvent) {
    event.preventDefault();
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
    }
  }

  if (isLoading || !profile) {
    return <section className="page profile-page"><LoadingSkeleton width="100%" height={420} /></section>;
  }

  return (
    <section className="page profile-page">
      <header className="page__header">
        <div><p className="page__eyebrow">Account</p><h1>Profile</h1></div>
      </header>
      <div className="profile-layout">
        <form className="profile-card" onSubmit={submit}>
          <div className="profile-avatar-row">
            <span className="avatar-circle avatar-circle--lg">{displayName.slice(0, 1).toUpperCase()}</span>
            <Button variant="secondary" type="button">Upload</Button>
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
          <Button variant="primary" type="submit">Save</Button>
        </form>
        <aside className="profile-stats">
          <Stat label="Level" value={profile.level} />
          <Stat label="Total habits" value={profile.total_habits} />
          <Stat label="Longest streak" value={profile.streak_longest} />
          <Stat label="Focus time" value={`${profile.total_focus_minutes}m`} />
        </aside>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="profile-stat"><span>{label}</span><strong>{value}</strong></div>;
}
