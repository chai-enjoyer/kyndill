import { NavLink } from 'react-router-dom';

const ITEMS: { to: string; label: string }[] = [
  { to: '/', label: 'Today' },
  { to: '/habits', label: 'Habits' },
  { to: '/pet', label: 'Pet' },
  { to: '/focus', label: 'Focus' },
  { to: '/shop', label: 'Shop' },
  { to: '/friends', label: 'Friends' },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/profile', label: 'Profile' },
  { to: '/settings', label: 'Settings' },
];

export function Sidebar() {
  return (
    <nav className="sidebar" aria-label="Primary">
      <ul className="sidebar__list">
        {ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                ['sidebar__link', isActive ? 'sidebar__link--active' : null]
                  .filter(Boolean)
                  .join(' ')
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
