import { useEffect, useState } from 'react';
import './App.css';
import { ApiClientError, getCurrentUser, login, logout, register } from './api/client';
import { AuthForm } from './components/AuthForm';
import type { AuthRequest, User } from './types/auth';

type AuthMode = 'login' | 'register';
type SessionStatus = 'loading' | 'anonymous' | 'authenticated';

function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('loading');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getCurrentUser()
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setCurrentUser(response.user);
        setSessionStatus('authenticated');
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setCurrentUser(null);
        setSessionStatus('anonymous');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleAuthSubmit(request: AuthRequest) {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = authMode === 'login' ? await login(request) : await register(request);
      setCurrentUser(response.user);
      setSessionStatus('authenticated');
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogout() {
    await logout();
    setCurrentUser(null);
    setSessionStatus('anonymous');
    setAuthMode('login');
  }

  if (sessionStatus === 'loading') {
    return (
      <main className="app app--centered">
        <p className="status-message">Loading...</p>
      </main>
    );
  }

  if (sessionStatus === 'authenticated' && currentUser) {
    return (
      <main className="app">
        <header className="app-header">
          <div>
            <p className="eyebrow">Signed in as</p>
            <h1>{currentUser.email}</h1>
          </div>
          <button className="secondary-button" onClick={handleLogout} type="button">
            Log out
          </button>
        </header>

        <section className="panel">
          <h2>Tasks</h2>
          <p className="muted">Task management UI comes next.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app app--centered">
      <section className="auth-panel">
        <AuthForm mode={authMode} error={formError} isSubmitting={isSubmitting} onSubmit={handleAuthSubmit} />
        <button
          className="link-button"
          onClick={() => {
            setAuthMode(authMode === 'login' ? 'register' : 'login');
            setFormError(null);
          }}
          type="button"
        >
          {authMode === 'login' ? 'Need an account? Register' : 'Already have an account? Log in'}
        </button>
      </section>
    </main>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    const firstValidationMessage = error.errors ? Object.values(error.errors).flat()[0] : null;
    return firstValidationMessage ?? error.message;
  }

  return 'Something went wrong. Please try again.';
}

export default App;
