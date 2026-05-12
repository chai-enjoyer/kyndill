import { Link } from 'react-router-dom';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export function AuthPage({ mode }: AuthPageProps) {
  const isLogin = mode === 'login';
  return (
    <section className="page page--auth">
      <div className="auth-card">
        <h1 className="auth-card__title">{isLogin ? 'Welcome back.' : 'Light your first flame.'}</h1>
        <p className="auth-card__sub text-muted">
          {isLogin
            ? 'Sign in to keep tending your habits.'
            : 'Start small. Come back tomorrow.'}
        </p>
        <p className="text-muted">Coming soon.</p>
        <p className="auth-card__switch">
          {isLogin ? (
            <>
              No account yet? <Link to="/register">Create one</Link>
            </>
          ) : (
            <>
              Have an account? <Link to="/login">Sign in</Link>
            </>
          )}
        </p>
      </div>
    </section>
  );
}
