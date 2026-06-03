import { Link } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';
import { useAuthContext } from '../../context/AuthContext';

interface MobilePageHeaderProps {
  /* Kept for back-compat with existing callers - the header always
   * renders the Kyndill wordmark on every page so the chrome is
   * identical app-wide. The page title belongs in the page's own
   * heading below the header, not in the header itself. */
  title?: string;
}

/*
 * Mobile-only page header. Rendered at the top of every page (except
 * Settings). Identical visual chrome on every page: brand mark + the
 * Kyndill wordmark on the left, notification bell -> profile avatar ->
 * settings on the right. 56px tall, flush with the safe-area top, 1px
 * bottom border. Hidden on desktop via CSS (the universal TopNav takes
 * over above 880px).
 */
export function MobilePageHeader(_props: MobilePageHeaderProps = {}) {
  void _props;
  const { user } = useAuthContext();
  const initial = user?.display_name?.slice(0, 1).toUpperCase() ?? '·';

  return (
    <header className="m-page-header">
      <Link to="/" className="m-page-header__brand" aria-label="Kyndill home">
        <span className="m-page-header__mark" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="22" height="22" fill="none">
            <path d="M16.4 7.2c1.5 4.2 5.1 6.4 5.1 11.1 0 4.1-3.1 7.2-7.3 7.2-3.6 0-6.3-2.6-6.3-6.2 0-3.1 2-5.1 3.8-6.8.2 2.3 1 3.7 2.4 4.6-.5-3.8.5-6.9 2.3-9.9Z" fill="var(--color-accent)" />
            <path d="M16 19.3c1.4 1.3 2.1 2.3 2.1 3.6 0 1.8-1.3 3.1-3.2 3.1-1.7 0-2.9-1.1-2.9-2.9 0-1.5 1-2.5 2.2-3.5.1 1 .5 1.7 1.3 2.2-.2-.9.1-1.7.5-2.5Z" fill="var(--color-honey)" />
          </svg>
        </span>
        <span className="m-page-header__wordmark">Kyndill</span>
      </Link>

      <div className="m-page-header__actions">
        <NotificationBell />
        <Link
          to="/profile"
          className="m-page-header__avatar-link"
          aria-label={`Profile, level ${user?.level ?? 1}`}
        >
          <span className="m-page-header__avatar" aria-hidden="true">
            {user?.avatar_url ? <img src={user.avatar_url} alt="" /> : initial}
          </span>
        </Link>
        <Link
          to="/settings"
          className="m-page-header__icon-link"
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
