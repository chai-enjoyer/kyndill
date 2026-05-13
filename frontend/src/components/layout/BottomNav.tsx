import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

const PRIMARY_ITEMS: { to: string; label: string; icon: string }[] = [
  { to: '/', label: 'Home', icon: 'M4.5 11.4 12 4.5l7.5 6.9V20a1 1 0 0 1-1 1h-4.6v-5.7h-3.8V21H5.5a1 1 0 0 1-1-1v-8.6z' },
  { to: '/habits', label: 'Habits', icon: 'M8.2 7h10M8.2 12h10M8.2 17h6.5M4.8 7h.02M4.8 12h.02M4.8 17h.02' },
  { to: '/focus', label: 'Focus', icon: 'M12 4.2v2.6M12 17.2v2.6M4.2 12h2.6M17.2 12h2.6M7.9 7.9l1.8 1.8M14.3 14.3l1.8 1.8M16.1 7.9l-1.8 1.8M9.7 14.3l-1.8 1.8M12 15.3a3.3 3.3 0 1 0 0-6.6 3.3 3.3 0 0 0 0 6.6z' },
  { to: '/friends', label: 'Friends', icon: 'M8.7 11.2a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4zM3.4 21a5.7 5.7 0 0 1 11.2 0M17 10.5a3.1 3.1 0 1 0 0-6.2M15.8 15.4A5.1 5.1 0 0 1 22.1 21' },
];

const MORE_ITEMS: { to: string; label: string; icon: string }[] = [
  { to: '/shop', label: 'Shop', icon: 'M7.1 8.2h9.8l-.8 10.5a1.6 1.6 0 0 1-1.6 1.5H9.5a1.6 1.6 0 0 1-1.6-1.5L7.1 8.2zM9.4 8.2a2.6 2.6 0 1 1 5.2 0M8.8 12.2h6.4' },
  { to: '/leaderboard', label: 'Leaderboard', icon: 'M8 21h8M12 17v4M7 4h10v3a5 5 0 0 1-10 0V4zM7 6H4.5a2 2 0 0 0 0 4H7M17 6h2.5a2 2 0 0 1 0 4H17' },
  { to: '/progress', label: 'Progress', icon: 'M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-8M20 16v-3' },
  { to: '/pet', label: 'Pet', icon: 'M8.2 13.2a4.2 4.2 0 1 0 7.6 0M7 8.3c.2-2 1.8-3.6 3.9-3.8M17 8.3c-.2-2-1.8-3.6-3.9-3.8M9.2 11.4h.01M14.8 11.4h.01M10 16.1c1.3.9 2.7.9 4 0' },
  { to: '/profile', label: 'Profile', icon: 'M12 12.2a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2zM4.4 21a7.6 7.6 0 0 1 15.2 0' },
  { to: '/settings', label: 'Settings', icon: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM19.2 15a1.4 1.4 0 0 0 .3 1.6l.1.1-2.8 2.8-.1-.1a1.4 1.4 0 0 0-1.6-.3 1.4 1.4 0 0 0-.8 1.3V20h-4v-.1a1.4 1.4 0 0 0-.8-1.3 1.4 1.4 0 0 0-1.6.3l-.1.1-2.8-2.8.1-.1A1.4 1.4 0 0 0 4.8 15a1.4 1.4 0 0 0-1.3-.8H3v-4h.5a1.4 1.4 0 0 0 1.3-.8 1.4 1.4 0 0 0-.3-1.6l-.1-.1 2.8-2.8.1.1a1.4 1.4 0 0 0 1.6.3 1.4 1.4 0 0 0 .8-1.3V4h4v.1a1.4 1.4 0 0 0 .8 1.3 1.4 1.4 0 0 0 1.6-.3l.1-.1 2.8 2.8-.1.1a1.4 1.4 0 0 0-.3 1.6 1.4 1.4 0 0 0 1.3.8h.5v4h-.5a1.4 1.4 0 0 0-1.3.8z' },
];

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const rootRef = useRef<HTMLElement | null>(null);
  const { logout } = useAuthContext();
  const moreActive = MORE_ITEMS.some((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));

  useEffect(() => {
    setMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!moreOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setMoreOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMoreOpen(false);
    }

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [moreOpen]);

  return (
    <nav className="bottom-nav" aria-label="Primary mobile" ref={rootRef}>
      <ul className="bottom-nav__list">
        {PRIMARY_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                ['bottom-nav__link', isActive ? 'bottom-nav__link--active' : null]
                  .filter(Boolean)
                  .join(' ')
              }
            >
              <svg
                className="bottom-nav__icon"
                viewBox="0 0 24 24"
                width="26"
                height="26"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={item.icon} />
              </svg>
              <span className="bottom-nav__label">{item.label}</span>
            </NavLink>
          </li>
        ))}
        <li className="bottom-nav__more">
          <button
            type="button"
            className={['bottom-nav__link', moreActive || moreOpen ? 'bottom-nav__link--active' : null].filter(Boolean).join(' ')}
            aria-haspopup="menu"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((open) => !open)}
          >
            <NavIcon path="M5 12h.01M12 12h.01M19 12h.01" />
            <span className="bottom-nav__label">More</span>
          </button>

          {moreOpen && (
            <div className="bottom-nav__menu" role="menu" aria-label="More navigation">
              {MORE_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  role="menuitem"
                  className={[
                    'bottom-nav__menu-link',
                    location.pathname === item.to || location.pathname.startsWith(`${item.to}/`) ? 'bottom-nav__menu-link--active' : null,
                  ].filter(Boolean).join(' ')}
                >
                  <NavIcon path={item.icon} menu />
                  <span>{item.label}</span>
                </Link>
              ))}
              <button type="button" role="menuitem" className="bottom-nav__menu-link" onClick={logout}>
                <NavIcon path="M10 6H5.8A1.8 1.8 0 0 0 4 7.8v8.4A1.8 1.8 0 0 0 5.8 18H10M14 8l4 4-4 4M18 12H9" menu />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </li>
      </ul>
    </nav>
  );
}

function NavIcon({ path, menu = false }: { path: string; menu?: boolean }) {
  return (
    <svg
      className={menu ? 'bottom-nav__menu-icon' : 'bottom-nav__icon'}
      viewBox="0 0 24 24"
      width={menu ? 20 : 26}
      height={menu ? 20 : 26}
      fill="none"
      stroke="currentColor"
      strokeWidth={menu ? 2 : 2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  );
}
