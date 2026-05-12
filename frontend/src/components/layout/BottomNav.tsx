import { NavLink } from 'react-router-dom';

const ITEMS: { to: string; label: string; icon: string }[] = [
  { to: '/', label: 'Today', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { to: '/habits', label: 'Habits', icon: 'M5 7h14M5 12h14M5 17h14' },
  { to: '/pet', label: 'Pet', icon: 'M12 3c-2 4-4 5-4 9a4 4 0 008 0c0-2-1-3-2-4 0-2 0-3-2-5z' },
  { to: '/focus', label: 'Focus', icon: 'M12 4a8 8 0 100 16 8 8 0 000-16zM12 8v4l3 2' },
  { to: '/friends', label: 'Friends', icon: 'M9 11a4 4 0 100-8 4 4 0 000 8zM3 21a6 6 0 0112 0M17 11a3 3 0 100-6 3 3 0 000 6zM23 21a5 5 0 00-9 0' },
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
