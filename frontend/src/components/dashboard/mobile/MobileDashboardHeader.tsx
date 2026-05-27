import { Link } from 'react-router-dom';
import { NotificationBell } from '../../layout/NotificationBell';

/*
 * Mobile dashboard header. Rendered inside the .dashboard__mobile branch
 * only — desktop continues to use the universal TopNav above the page.
 * 56px tall, app brand left, bell + settings right, 1px bottom border.
 */
export function MobileDashboardHeader() {
  return (
    <header className="m-dashboard-header">
      <Link to="/" className="m-dashboard-header__brand" aria-label="Kyndill home">
        <span className="m-dashboard-header__mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="22" height="22" fill="none">
            <path d="M16.4 7.2c1.5 4.2 5.1 6.4 5.1 11.1 0 4.1-3.1 7.2-7.3 7.2-3.6 0-6.3-2.6-6.3-6.2 0-3.1 2-5.1 3.8-6.8.2 2.3 1 3.7 2.4 4.6-.5-3.8.5-6.9 2.3-9.9Z" fill="var(--color-accent)" />
            <path d="M16 19.3c1.4 1.3 2.1 2.3 2.1 3.6 0 1.8-1.3 3.1-3.2 3.1-1.7 0-2.9-1.1-2.9-2.9 0-1.5 1-2.5 2.2-3.5.1 1 .5 1.7 1.3 2.2-.2-.9.1-1.7.5-2.5Z" fill="var(--color-honey)" />
          </svg>
        </span>
        <span className="m-dashboard-header__wordmark">Kyndill</span>
      </Link>

      <div className="m-dashboard-header__actions">
        <NotificationBell />
        <Link
          to="/settings"
          className="m-dashboard-header__icon-link"
          aria-label="Settings"
          title="Settings"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1A2 2 0 0 1 4.2 17l.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.6-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.3 7A2 2 0 0 1 7.1 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1A2 2 0 0 1 19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1a2 2 0 0 1 0 4H21a1.7 1.7 0 0 0-1.6 1z" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
