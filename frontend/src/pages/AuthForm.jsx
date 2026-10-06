import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Alert, FieldError } from '../components/UI';

/**
 * Login and registration share this component.
 * `mode` only changes the wording, the validation and the API call, which keeps
 * both forms consistent without duplicating markup.
 */
export default function AuthForm({ mode = 'login' }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const redirectTo = location.state?.from || '/dashboard';

  function update(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      // Clear the field error as soon as the user starts fixing it.
      setErrors((current) => ({ ...current, [field]: undefined }));
    };
  }

  /** Client-side checks so obvious mistakes never reach the server. */
  function validate() {
    const next = {};
    if (!isLogin && !form.name.trim()) next.name = 'Please enter your name.';
    if (!form.email.trim()) next.email = 'Please enter your email address.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      next.email = 'Please enter a valid email address.';
    if (!form.password) next.password = 'Please enter your password.';
    else if (!isLogin && form.password.length < 6)
      next.password = 'Your password must be at least 6 characters long.';
    return next;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');

    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setBusy(true);
    try {
      if (isLogin) {
        await login({ email: form.email, password: form.password });
        navigate(redirectTo, { replace: true });
      } else {
        await register({ name: form.name, email: form.email, password: form.password });
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      setErrors(error.errors || {});
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="card auth__card">
        <h1 className="auth__title">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
        <p className="auth__subtitle">
          {isLogin
            ? 'Log in to open your dashboard and saved meal plans.'
            : 'Sign up to start generating personalised meal plans.'}
        </p>

        {message && (
          <Alert type="error" onDismiss={() => setMessage('')}>
            {message}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {!isLogin && (
            <div className="field">
              <label className="field__label" htmlFor="name">
                Full name
              </label>
              <input
                id="name"
                name="name"
                className="input"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={update('name')}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              <FieldError id="name-error" message={errors.name} />
            </div>
          )}

          <div className="field">
            <label className="field__label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              name="email"
              className="input"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={update('email')}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            <FieldError id="email-error" message={errors.email} />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              className="input"
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={form.password}
              onChange={update('password')}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : 'password-hint'}
            />
            {!isLogin && (
              <p className="field__hint" id="password-hint">
                At least 6 characters.
              </p>
            )}
            <FieldError id="password-error" message={errors.password} />
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
            {busy ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
          </button>
        </form>

        <p className="auth__switch">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <Link to={isLogin ? '/register' : '/login'}>
            {isLogin ? 'Sign up' : 'Log in'}
          </Link>
        </p>
      </div>
    </div>
  );
}
