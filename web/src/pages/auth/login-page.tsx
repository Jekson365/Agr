import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import farmland from '@/assets/farmland-wide.png';
import logo from '@/assets/logo.png';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { loadGoogleIdentity, type GoogleCredentialResponse } from '@/services/google-identity';
import './login-page.css';

type Mode = 'login' | 'register';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Google OAuth 2.0 "Web application" client ID (see VITE_GOOGLE_CLIENT_ID in .env). When unset,
// the login falls back to a disabled placeholder button instead of the real Google button.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// GIS caps a rendered button at 400px wide.
const GOOGLE_BUTTON_MAX_WIDTH = 400;

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4Z" />
      <path d="M12 22c2.7 0 5-.9 6.6-2.4L15.4 17c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
      <path d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9Z" />
      <path d="M12 6c1.5 0 2.8.5 3.8 1.5L18.7 5A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6Z" />
    </svg>
  );
}

function IconInput({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="auth-input">
      <span className="auth-input-icon">{icon}</span>
      {children}
    </div>
  );
}

export function LoginPage() {
  const { signIn, signUp, signInWithGoogle, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  // The landing page's "Start Free" links ask for the register tab, so a visitor who came to sign
  // up doesn't land on a login form and have to find the tab.
  const [mode, setMode] = useState<Mode>(() =>
    (location.state as { mode?: Mode } | null)?.mode === 'register' ? 'register' : 'login'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const googleButtonRef = useRef<HTMLDivElement>(null);

  // The GIS callback is registered once (see the effect below) but needs current state setters
  // and context, so route it through a ref that we refresh on every render.
  const handleCredential = async (response: GoogleCredentialResponse) => {
    const idToken = response.credential;
    if (!idToken) {
      setError(t('auth.errorGoogleSignIn'));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle(idToken);
      // On success `isAuthenticated` flips and the <Navigate> below redirects home.
    } catch (err) {
      console.error('[login] google sign-in failed:', err);
      setError(t('auth.errorGoogleSignIn'));
      setSubmitting(false);
    }
  };
  const handleCredentialRef = useRef(handleCredential);
  useEffect(() => {
    handleCredentialRef.current = handleCredential;
  });

  // Load Google Identity Services and render the official "Continue with Google" button once.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    loadGoogleIdentity()
      .then((google) => {
        const slot = googleButtonRef.current;
        if (cancelled || !slot) return;
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => handleCredentialRef.current(response),
          ux_mode: 'popup',
        });
        google.accounts.id.renderButton(slot, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'center',
          width: Math.min(slot.offsetWidth || 320, GOOGLE_BUTTON_MAX_WIDTH),
        });
      })
      .catch((err) => console.error('[login] failed to load Google Identity Services:', err));

    return () => {
      cancelled = true;
    };
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const validate = (): string | null => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password || (mode === 'register' && !name.trim())) {
      return t('auth.errorFillFields');
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      return t('auth.errorInvalidEmail');
    }
    if (mode === 'register') {
      if (password.length < 6) {
        return t('auth.errorPasswordShort');
      }
      if (password !== confirmPassword) {
        return t('auth.errorPasswordMismatch');
      }
    }
    return null;
  };

  const messageForError = (err: unknown): string => {
    console.error('[login] request failed:', err);
    if (err instanceof ApiError) {
      if (err.status === 401) return t('auth.errorInvalidCredentials');
      if (err.status === 409) return t('auth.errorEmailExists');
    }
    return t('auth.errorGeneric');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await signUp({ name: name.trim(), email: email.trim(), password });
      }
    } catch (err) {
      setError(messageForError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-screen">
      <img src={farmland} className="auth-bg" alt="" />
      <div className="auth-scrim" />

      <div className="auth-topbar">
        <LanguageToggle />
      </div>

      <div className="auth-content">
        <div className="auth-hero">
          <div className="auth-logo-badge">
            <img src={logo} alt="" />
          </div>
          <h1 className="auth-app-name">{t('auth.appName')}</h1>
          <p className="auth-tagline">{t('auth.tagline')}</p>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              type="button"
              className={mode === 'login' ? 'auth-tab active' : 'auth-tab'}
              onClick={() => switchMode('login')}
            >
              {t('auth.login')}
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'auth-tab active' : 'auth-tab'}
              onClick={() => switchMode('register')}
            >
              {t('auth.register')}
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {mode === 'register' && (
              <IconInput icon={<PersonIcon />}>
                <input
                  id="name"
                  type="text"
                  placeholder={t('auth.fullName')}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </IconInput>
            )}

            <IconInput icon={<MailIcon />}>
              <input
                id="email"
                type="email"
                placeholder={t('auth.email')}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </IconInput>

            <IconInput icon={<LockIcon />}>
              <input
                id="password"
                type="password"
                placeholder={t('auth.password')}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </IconInput>

            {mode === 'register' && (
              <IconInput icon={<LockIcon />}>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('auth.confirmPassword')}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </IconInput>
            )}

            {mode === 'login' && (
              <button type="button" className="auth-forgot">
                {t('auth.forgotPassword')}
              </button>
            )}

            {error && <div className="error-banner">{error}</div>}

            <button type="submit" className="btn auth-submit" disabled={submitting}>
              {submitting
                ? mode === 'login'
                  ? t('auth.signingIn')
                  : t('auth.creatingAccount')
                : mode === 'login'
                  ? t('auth.login')
                  : t('auth.register')}
            </button>

            <div className="auth-divider">
              <span className="auth-divider-line" />
              <span className="auth-divider-text">{t('auth.or')}</span>
              <span className="auth-divider-line" />
            </div>

            {GOOGLE_CLIENT_ID ? (
              <div ref={googleButtonRef} className="auth-google-slot" />
            ) : (
              <button type="button" className="auth-google" disabled>
                <GoogleIcon />
                <span>{t('auth.continueWithGoogle')}</span>
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
