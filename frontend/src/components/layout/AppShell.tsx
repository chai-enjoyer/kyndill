import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';

export function AppShell() {
  return (
    <div className="app-shell">
      <TopNav />
      <main id="main" className="app-shell__main" tabIndex={-1}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
