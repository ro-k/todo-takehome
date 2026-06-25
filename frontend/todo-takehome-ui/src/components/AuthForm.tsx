import { useState } from 'react';
import type { FormEvent } from 'react';
import type { AuthRequest } from '../types/auth';

type AuthMode = 'login' | 'register';

type AuthFormProps = {
  mode: AuthMode;
  error: string | null;
  isSubmitting: boolean;
  onSubmit: (request: AuthRequest) => Promise<void>;
};

export function AuthForm({ mode, error, isSubmitting, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({ email, password });
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h1>{mode === 'login' ? 'Log in' : 'Create account'}</h1>

      <label>
        Email
        <input
          autoComplete="email"
          disabled={isSubmitting}
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>

      <label>
        Password
        <input
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          disabled={isSubmitting}
          minLength={mode === 'register' ? 8 : undefined}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Working...' : mode === 'login' ? 'Log in' : 'Register'}
      </button>
    </form>
  );
}

