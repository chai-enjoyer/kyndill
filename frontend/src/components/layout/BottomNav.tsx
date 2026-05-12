import { NavLink } from 'react-router-dom';

const ITEMS: { to: string; label: string; icon: string }[] = [
  { to: '/', label: 'Home', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { to: '/habits', label: 'Habits', icon: 'M5 7h14M5 12h14M5 17h14' },
  { to: '/friends', label: 'Friends', icon: 'M9 11a4 4 0 100-8 4 4 0 000 8zM3 21a6 6 0 0112 0M17 11a3 3 0 100-6 3 3 0 000 6zM23 21a5 5 0 00-9 0' },
  { to: '/profile', label: 'Profile', icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0' },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary mobile">
      <ul className="bottom-nav__list">
        {ITEMS.map((item) => (
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
                viewBox="0 0 24 24"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
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
      </ul>
    </nav>
  );
}
