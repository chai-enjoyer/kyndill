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
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get<ProfileData>('/api/user/profile');
      setProfile(data);
      setError(null);
    } catch (err) {
      setError(extractMessage(err, 'Could not load profile.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const save = useCallback(async (input: Partial<ProfileData>): Promise<ProfileData> => {
    const { data } = await api.patch<ProfileData>('/api/user/profile', input);
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
  }, []);

  return { profile, isLoading, error, refetch, save, changePassword, deleteAccount };
}
