import { Link, NavLink } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

const NAV_ITEMS: { to: string; label: string; end?: boolean }[] = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/habits', label: 'Habits' },
  { to: '/friends', label: 'Friends' },
  { to: '/focus', label: 'Focus' },
  { to: '/shop', label: 'Shop' },
];

function classes(...parts: Array<string | null | false | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function TopNav() {
  const { user, logout } = useAuthContext();

  return (
    <header className="top-nav">
      <Link to="/" className="top-nav__brand" aria-label="Kyndill home">
        <span className="top-nav__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <path
              d="M12 3c-2 4-4 5-4 9a4 4 0 0 0 8 0c0-2-1-3-2-4 0-2 0-3-2-5z"
              fill="var(--color-accent)"
            />
          </svg>
        </span>
        <span className="top-nav__wordmark">Kyndill</span>
      </Link>

      <nav className="top-nav__nav" aria-label="Primary">
        <ul className="top-nav__nav-list">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  classes('top-nav__nav-link', isActive && 'top-nav__nav-link--active')
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {user && (
        <div className="top-nav__meta">
          <span className="top-nav__stat" title="Current streak">
            <span className="top-nav__stat-icon top-nav__stat-icon--flame" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M12 3c-2 4-4 5-4 9a4 4 0 0 0 8 0c0-2-1-3-2-4 0-2 0-3-2-5z" />
              </svg>
            </span>
            <span className="top-nav__stat-value">{user.streak_current}</span>
            <span className="top-nav__stat-label">{user.streak_current === 1 ? 'day' : 'days'}</span>
          </span>

          <Link to="/profile" className="top-nav__level" aria-label={`Level ${user.level}, profile`}>
            <span aria-hidden="true">L{user.level}</span>
          </Link>

          <span className="top-nav__stat" title="Coins">
            <span className="top-nav__stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="8" />
                <path d="M9 9c1.2-1.4 4.8-1.4 6 0M15 15c-1.2 1.4-4.8 1.4-6 0" strokeLinecap="round" />
              </svg>
            </span>
            <span className="top-nav__stat-value">{user.coins}</span>
            <span className="top-nav__stat-label">coins</span>
          </span>

          <button
            type="button"
            className="btn btn--ghost btn--sm top-nav__signout"
            onClick={logout}
            aria-label="Sign out"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
