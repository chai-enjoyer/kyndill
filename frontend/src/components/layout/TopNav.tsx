import { Link, NavLink } from 'react-router-dom';
import { useRef } from 'react';
import { useAuthContext } from '../../context/AuthContext';
import { AnimatedValue } from '../common/AnimatedValue';
import { FlameIcon } from '../common/FlameIcon';
import { createFlameMotionStyle, type FlameMotionStyle } from '../../lib/flameMotion';
import { NotificationBell } from './NotificationBell';

const NAV_ITEMS: { to: string; label: string; end?: boolean }[] = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/progress', label: 'Progress' },
  { to: '/habits', label: 'Habits' },
  { to: '/friends', label: 'Friends' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/focus', label: 'Focus' },
  { to: '/shop', label: 'Shop' },
];

function classes(...parts: Array<string | null | false | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function TopNav() {
  const { user, logout } = useAuthContext();
  const brandFlameStyle = useRef<FlameMotionStyle | null>(null);
  if (!brandFlameStyle.current) brandFlameStyle.current = createFlameMotionStyle();

  return (
    <header className="top-nav">
      <Link to="/" className="top-nav__brand" aria-label="Kyndill home">
        <span className="top-nav__mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="30" height="30" fill="none" style={brandFlameStyle.current}>
            <rect className="top-nav__brand-aura" x="4" y="4" width="24" height="24" rx="9" fill="var(--color-accent-subtle)" />
            <path className="top-nav__brand-flame" d="M16.4 7.2c1.5 4.2 5.1 6.4 5.1 11.1 0 4.1-3.1 7.2-7.3 7.2-3.6 0-6.3-2.6-6.3-6.2 0-3.1 2-5.1 3.8-6.8.2 2.3 1 3.7 2.4 4.6-.5-3.8.5-6.9 2.3-9.9Z" fill="var(--color-accent)" />
            <path className="top-nav__brand-flame-inner" d="M16 19.3c1.4 1.3 2.1 2.3 2.1 3.6 0 1.8-1.3 3.1-3.2 3.1-1.7 0-2.9-1.1-2.9-2.9 0-1.5 1-2.5 2.2-3.5.1 1 .5 1.7 1.3 2.2-.2-.9.1-1.7.5-2.5Z" fill="var(--color-honey)" />
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
              <FlameIcon size={23} />
            </span>
            <AnimatedValue value={user.streak_current} className="top-nav__stat-value" />
            <span className="top-nav__stat-label">{user.streak_current === 1 ? 'day' : 'days'}</span>
          </span>

          <Link to="/profile" className="top-nav__level" aria-label={`Level ${user.level}, profile`}>
            <span className="top-nav__avatar" aria-hidden="true">
              {user.avatar_url ? <img src={user.avatar_url} alt="" /> : user.display_name.slice(0, 1).toUpperCase()}
            </span>
            <span aria-hidden="true">
              Level <AnimatedValue value={user.level} className="top-nav__level-value" />
            </span>
          </Link>

          <span className="top-nav__stat" title="Coins">
            <span className="top-nav__stat-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9">
                <circle cx="12" cy="12" r="8.4" fill="currentColor" opacity=".18" />
                <circle cx="12" cy="12" r="6.2" />
                <path d="M8.9 9.9c1.3-1.1 4.9-1.1 6.2 0M15.1 14.1c-1.3 1.1-4.9 1.1-6.2 0" strokeLinecap="round" />
                <path d="M12 7.8v8.4" strokeLinecap="round" opacity=".55" />
              </svg>
            </span>
            <AnimatedValue value={user.coins} className="top-nav__stat-value" />
            <span className="top-nav__stat-label">coins</span>
          </span>

          <NotificationBell />

          <Link to="/settings" className="top-nav__icon-link" aria-label="Settings" title="Settings">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 0 1 4.2 17l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.6-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.3 7A2 2 0 0 1 7.1 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 0 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1a2 2 0 0 1 0 4H21a1.7 1.7 0 0 0-1.6 1z" />
            </svg>
          </Link>

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
