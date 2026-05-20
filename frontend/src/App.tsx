import { useEffect, type ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from './context/AuthContext';
import { ToastViewport } from './components/common/Toast';
import { trackEvent } from './lib/analytics';
import { AppShell } from './components/layout/AppShell';
import { AuthPage } from './pages/AuthPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProgressPage } from './pages/ProgressPage';
import { HabitsPage } from './pages/HabitsPage';
import { PetPage } from './pages/PetPage';
import { ShopPage } from './pages/ShopPage';
import { FriendsPage } from './pages/FriendsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { FocusPage } from './pages/FocusPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

function FullPageLoading() {
  return <div className="app-shell__loading" aria-busy="true" aria-live="polite" />;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { token, isLoading, petInitialized } = useAuthContext();
  if (isLoading) return <FullPageLoading />;
  if (!token) return <Navigate to="/login" replace />;
  if (petInitialized === false) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function RequireAuthForOnboarding({ children }: { children: ReactNode }) {
  const { token, isLoading, petInitialized } = useAuthContext();
  if (isLoading) return <FullPageLoading />;
  if (!token) return <Navigate to="/login" replace />;
  if (petInitialized === true) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { token, isLoading, petInitialized } = useAuthContext();
  if (isLoading) return <FullPageLoading />;
  if (token) {
    if (petInitialized === false) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    trackEvent('page_view', { path: location.pathname });
  }, [location.pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <PageViewTracker />
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <AuthPage mode="login" />
            </PublicOnly>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnly>
              <AuthPage mode="register" />
            </PublicOnly>
          }
        />
        <Route
          path="/onboarding"
          element={
            <RequireAuthForOnboarding>
              <OnboardingPage />
            </RequireAuthForOnboarding>
          }
        />

        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/pet" element={<PetPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/focus" element={<FocusPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastViewport />
    </>
  );
}
