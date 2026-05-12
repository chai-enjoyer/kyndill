import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, TOKEN_STORAGE_KEY } from '../lib/api';

export interface AuthUser {
  id: string;
  email: string;
  display_name: string;
  username: string;
  level: number;
  xp: number;
  coins: number;
  streak_current: number;
  streak_longest: number;
  avatar_url: string | null;
  visibility: 'public' | 'friends' | 'private';
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!token);

  const fetchMe = useCallback(async (signal?: AbortSignal): Promise<void> => {
    try {
      const { data } = await api.get<AuthUser>('/api/auth/me', { signal });
      setUser(data);
    } catch (err) {
      if (signal?.aborted) return;
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setUser(null);
      return;
    }
    const controller = new AbortController();
    setIsLoading(true);
    fetchMe(controller.signal).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false);
    });
    return () => controller.abort();
  }, [token, fetchMe]);

  const acceptAuthResponse = useCallback(
    async (data: { token: string }) => {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      setToken(data.token);
      await fetchMe();
    },
    [fetchMe],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<{ token: string }>('/api/auth/login', { email, password });
      await acceptAuthResponse(data);
    },
    [acceptAuthResponse],
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      const { data } = await api.post<{ token: string }>('/api/auth/register', {
        email,
        password,
        display_name: displayName,
      });
      await acceptAuthResponse(data);
    },
    [acceptAuthResponse],
  );

  const loginWithGoogle = useCallback(
    async (credential: string) => {
      const { data } = await api.post<{ token: string }>('/api/auth/google', { credential });
      await acceptAuthResponse(data);
    },
    [acceptAuthResponse],
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    if (token) await fetchMe();
  }, [token, fetchMe]);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, loginWithGoogle, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside an AuthProvider');
  return ctx;
}
