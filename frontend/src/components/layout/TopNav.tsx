import { Link } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';

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

      {user && (
        <div className="top-nav__meta">
          <span className="top-nav__stat" title="Current streak">
            <span className="top-nav__stat-value">{user.streak_current}</span>
            <span className="top-nav__stat-label">day streak</span>
          </span>
          <span className="top-nav__stat" title="Coins">
            <span className="top-nav__stat-value">{user.coins}</span>
            <span className="top-nav__stat-label">coins</span>
          </span>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
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
