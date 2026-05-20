import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, TOKEN_STORAGE_KEY } from '../lib/api';
import { clearProfileCache } from '../hooks/useProfile';
import { flush as flushAnalytics, setAnalyticsConsent } from '../lib/analytics';

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
  research_consent: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  petInitialized: boolean | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    passwordConfirmation: string,
    displayName: string,
  ) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  markPetInitialized: () => void;
  mergeUser: (partial: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [petInitialized, setPetInitialized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!token);

  const hydrate = useCallback(async (signal: AbortSignal): Promise<void> => {
    const [userResult, petResult] = await Promise.allSettled([
      api.get<AuthUser>('/api/auth/me', { signal }),
      api.get<{ initialized_at: string | null }>('/api/pet', { signal }),
    ]);
    if (signal.aborted) return;

    if (userResult.status === 'fulfilled') {
      setUser(userResult.value.data);
      setAnalyticsConsent(userResult.value.data.research_consent === true);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken(null);
      setUser(null);
      setPetInitialized(null);
      setAnalyticsConsent(false);
      return;
    }

    if (petResult.status === 'fulfilled') {
      setPetInitialized(petResult.value.data.initialized_at != null);
    } else {
      setPetInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setUser(null);
      setPetInitialized(null);
      return;
    }
    const controller = new AbortController();
    setIsLoading(true);
    hydrate(controller.signal).finally(() => {
      if (!controller.signal.aborted) setIsLoading(false);
    });
    return () => controller.abort();
  }, [token, hydrate]);

  const acceptAuthResponse = useCallback((data: { token: string }) => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    setToken(data.token);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.post<{ token: string }>('/api/auth/login', { email, password });
      acceptAuthResponse(data);
    },
    [acceptAuthResponse],
  );

  const register = useCallback(
    async (email: string, password: string, passwordConfirmation: string, displayName: string) => {
      const { data } = await api.post<{ token: string }>('/api/auth/register', {
        email,
        password,
        password_confirmation: passwordConfirmation,
        display_name: displayName,
      });
      acceptAuthResponse(data);
    },
    [acceptAuthResponse],
  );

  const loginWithGoogle = useCallback(
    async (credential: string) => {
      const { data } = await api.post<{ token: string }>('/api/auth/google', { credential });
      acceptAuthResponse(data);
    },
    [acceptAuthResponse],
  );

  const logout = useCallback(() => {
    void flushAnalytics();
    setAnalyticsConsent(false);
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    clearProfileCache();
    setToken(null);
    setUser(null);
    setPetInitialized(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    const controller = new AbortController();
    await hydrate(controller.signal);
  }, [token, hydrate]);

  const markPetInitialized = useCallback(() => {
    setPetInitialized(true);
  }, []);

  const mergeUser = useCallback((partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      if (partial.research_consent !== undefined) {
        setAnalyticsConsent(next.research_consent === true);
      }
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        petInitialized,
        login,
        register,
        loginWithGoogle,
        logout,
        refresh,
        markPetInitialized,
        mergeUser,
      }}
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
