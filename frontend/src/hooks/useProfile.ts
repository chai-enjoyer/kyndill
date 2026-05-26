import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { extractMessage } from './useSocial';

export interface ProfileData {
  id: string;
  email: string;
  display_name: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  visibility: 'public' | 'friends' | 'private';
  level: number;
  xp: number;
  coins: number;
  streak_current: number;
  streak_longest: number;
  total_habits: number;
  total_focus_minutes: number;
  auth_provider: 'email' | 'google';
  notification_prefs: NotificationPrefs;
  research_consent: boolean;
  share_text_consent: boolean;
  reminder_hour: number | null;
  reminder_timezone: string;
}

export interface NotificationPrefs {
  friendRequests: boolean;
  gifts: boolean;
  focusReminders: boolean;
  dailyReminder?: boolean;
}

// Module-level cache: survives navigation, scoped to the tab. Both Profile
// and Settings consume this hook; without a cache, every nav re-fetches and
// shows a skeleton flash.
let cachedProfile: ProfileData | null = null;
let inflightFetch: Promise<ProfileData> | null = null;
const subscribers = new Set<(profile: ProfileData) => void>();

function notifySubscribers(profile: ProfileData) {
  subscribers.forEach((subscriber) => subscriber(profile));
}

export function clearProfileCache(): void {
  cachedProfile = null;
  inflightFetch = null;
}

async function fetchProfile(): Promise<ProfileData> {
  if (inflightFetch) return inflightFetch;
  inflightFetch = api
    .get<ProfileData>('/api/user/profile')
    .then((res) => {
      cachedProfile = res.data;
      notifySubscribers(res.data);
      return res.data;
    })
    .finally(() => {
      inflightFetch = null;
    });
  return inflightFetch;
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(cachedProfile);
  const [isLoading, setIsLoading] = useState(cachedProfile === null);
  const [error, setError] = useState<string | null>(null);

  // Subscribe so a save() or background refresh from another mount keeps this
  // copy in sync.
  useEffect(() => {
    const listener = (next: ProfileData) => setProfile(next);
    subscribers.add(listener);
    return () => {
      subscribers.delete(listener);
    };
  }, []);

  const refetch = useCallback(async () => {
    if (cachedProfile === null) setIsLoading(true);
    try {
      const data = await fetchProfile();
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(extractMessage(err, 'Could not load profile.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // SWR: serve cache instantly, fetch fresh in the background.
    void refetch();
  }, [refetch]);

  const save = useCallback(async (input: Partial<ProfileData>): Promise<ProfileData> => {
    const { data } = await api.patch<ProfileData>('/api/user/profile', input);
    cachedProfile = data;
    notifySubscribers(data);
    setProfile(data);
    return data;
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api.post('/api/user/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }, []);

  const deleteAccount = useCallback(async () => {
    await api.delete('/api/user/account', { data: { confirmation: 'DELETE' } });
    clearProfileCache();
  }, []);

  return { profile, isLoading, error, refetch, save, changePassword, deleteAccount };
}
