import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthIllustration from '../illustrations/AuthIllustration';
import Button from '../components/ui/Button';

const ERROR_ICON = {
  ACCOUNT_LOCKED: (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0" aria-hidden="true">
      <rect x="5" y="9" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 9V6.5a3 3 0 016 0V9" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  RATE_LIMITED: (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  DEFAULT: (
    <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 6.5v4M10 13.2h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
};

export default function LoginPage() {
  const { login, authError, authErrorCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch {
      // authError / authErrorCode are set inside AuthContext.
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Brand / illustration side -- hidden on small screens to keep the
          form the sole focus on mobile, where a warden is most likely
          logging in from a phone at the gate. */}
      <div className="bg-brand-gradient relative hidden flex-col items-center justify-center overflow-hidden px-12 py-16 lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} aria-hidden="true" />
        <div className="relative max-w-xs">
          <AuthIllustration />
          <p className="mt-8 text-center font-display text-xl font-bold text-white">
            Every entry, verified.
          </p>
          <p className="mt-2 text-center text-sm text-indigo-100">
            Face-recognition entry logging and student records for hostel access control.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-paper px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <div className="bg-brand-gradient mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl font-display text-base font-bold text-white shadow-glow lg:mx-0">
              FR
            </div>
            <h1 className="font-display text-2xl font-bold text-ink dark:text-slate-100">Sign in to FRHES</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Enter your staff credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="card space-y-4 p-6" noValidate>
            {authError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-denied-500/30 bg-denied-50 px-3 py-2 text-sm text-denied-700"
              >
                {ERROR_ICON[authErrorCode] || ERROR_ICON.DEFAULT}
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="label" htmlFor="username">
                Username or email
              </label>
              <input
                id="username"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <Button type="submit" loading={submitting} className="w-full">
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Accounts are provisioned by an administrator. Contact yours if you don't have one.
          </p>
        </div>
      </div>
    </div>
  );
}
