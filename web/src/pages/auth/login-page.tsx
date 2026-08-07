import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import farmland from '@/assets/farmland-wide.webp';
import logo from '@/assets/logo.png';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { sendPhoneCode } from '@/services/auth-service';
import { loadGoogleIdentity, type GoogleCredentialResponse } from '@/services/google-identity';
import './login-page.css';

type Mode = 'login' | 'register';

/** Which identity the form is working with. Both reach the same account in the end. */
type Method = 'email' | 'phone';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Deliberately loose — the server normalises the number and is the one that decides. This only
   catches "that is not a number at all" before a request goes out. */
const PHONE_PATTERN = /^\+?[\d\s()-]{9,}$/;

const CODE_LENGTH = 6;

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

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M10.5 5.5h3" />
      <path d="M12 18.2h.01" />
    </svg>
  );
}

function KeypadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8h.01M12 8h.01M18 8h.01M6 13h.01M12 13h.01M18 13h.01M12 18h.01" />
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
  const { signIn, signUp, signInWithPhone, signUpWithPhone, signInWithGoogle, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  // The landing page's "Start Free" links ask for the register tab, so a visitor who came to sign
  // up doesn't land on a login form and have to find the tab.
  const [mode, setMode] = useState<Mode>(() =>
    (location.state as { mode?: Mode } | null)?.mode === 'register' ? 'register' : 'login'
  );
  // TEMPORARILY DISABLED: nothing switches this while the phone toggle is commented out, so the
  // setter would be an unused local (noUnusedLocals). Restore as: [method, setMethod].
  const [method] = useState<Method>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /* Registering by phone happens in two goes: the details, then the code that was texted back.
     `awaitingCode` is which of the two the form is showing. */
  const [awaitingCode, setAwaitingCode] = useState(false);
  const [code, setCode] = useState('');
  /** Seconds left before another code may be asked for; 0 means the button is live. */
  const [resendIn, setResendIn] = useState(0);

  // Ticks the resend countdown down to zero, one second at a time.
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

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
    return <Navigate to="/main" replace />;
  }

  /** Back to the details, e.g. after switching tabs or to correct the number. */
  const resetCodeStep = () => {
    setAwaitingCode(false);
    setCode('');
    setResendIn(0);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    resetCodeStep();
  };

  // TEMPORARILY DISABLED with the email/phone toggle below.
  // const switchMethod = (next: Method) => {
  //   setMethod(next);
  //   setError(null);
  //   resetCodeStep();
  // };

  const validate = (): string | null => {
    const identifier = method === 'email' ? email.trim() : phone.trim();
    if (!identifier || !password || (mode === 'register' && !name.trim())) {
      return t('auth.errorFillFields');
    }
    if (method === 'email' && !EMAIL_PATTERN.test(identifier)) {
      return t('auth.errorInvalidEmail');
    }
    if (method === 'phone' && !PHONE_PATTERN.test(identifier)) {
      return t('auth.errorInvalidPhone');
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

  /** The wait the server asked for, out of a 429 body of `{"retryAfterSeconds":42}`. */
  const retryAfterFrom = (err: ApiError): number => {
    try {
      const body = JSON.parse(err.message) as { retryAfterSeconds?: number };
      return typeof body.retryAfterSeconds === 'number' ? body.retryAfterSeconds : 60;
    } catch {
      return 60;
    }
  };

  const messageForError = (err: unknown): string => {
    console.error('[login] request failed:', err);
    if (err instanceof ApiError) {
      // The same status means different things on the two paths, so the message follows what the
      // form was actually doing when it came back.
      if (err.status === 401) {
        if (awaitingCode) return t('auth.errorInvalidCode');
        return method === 'phone' ? t('auth.errorInvalidPhoneCredentials') : t('auth.errorInvalidCredentials');
      }
      if (err.status === 409) {
        return method === 'phone' ? t('auth.errorPhoneExists') : t('auth.errorEmailExists');
      }
      if (err.status === 400 && method === 'phone') return t('auth.errorInvalidPhone');
      if (err.status === 429) {
        const seconds = retryAfterFrom(err);
        setResendIn(seconds);
        return t('auth.errorTooManyCodes', { seconds: String(seconds) });
      }
      if (err.status === 502) return t('auth.errorSmsFailed');
    }
    return t('auth.errorGeneric');
  };

  /** Asks for a code — both the first time and for the "send a new one" button. */
  const requestCode = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const { resendAfterSeconds } = await sendPhoneCode({ phoneNumber: phone.trim() });
      setAwaitingCode(true);
      setResendIn(resendAfterSeconds);
    } catch (err) {
      setError(messageForError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    // The code step has already validated the details behind it; all that is left is the digits.
    if (awaitingCode) {
      if (code.trim().length !== CODE_LENGTH) {
        setError(t('auth.errorInvalidCode'));
        return;
      }
      setError(null);
      setSubmitting(true);
      try {
        await signUpWithPhone({
          name: name.trim(),
          phoneNumber: phone.trim(),
          password,
          code: code.trim(),
        });
      } catch (err) {
        setError(messageForError(err));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Registering by phone doesn't create anything yet — it sends the code that will.
    if (mode === 'register' && method === 'phone') {
      await requestCode();
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        if (method === 'phone') {
          await signInWithPhone(phone.trim(), password);
        } else {
          await signIn(email.trim(), password);
        }
      } else {
        await signUp({ name: name.trim(), email: email.trim(), password });
      }
    } catch (err) {
      setError(messageForError(err));
    } finally {
      setSubmitting(false);
    }
  };

  /** What the submit button says, which depends on all three of mode, method and step. */
  const submitLabel = (): string => {
    if (submitting) {
      if (awaitingCode) return t('auth.creatingAccount');
      if (mode === 'register' && method === 'phone') return t('auth.sendingCode');
      return mode === 'login' ? t('auth.signingIn') : t('auth.creatingAccount');
    }
    if (awaitingCode) return t('auth.verifyAndCreate');
    if (mode === 'register' && method === 'phone') return t('auth.sendCode');
    return mode === 'login' ? t('auth.login') : t('auth.register');
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

          {/* TEMPORARILY DISABLED: the email/phone choice, along with the phone routes it led to
              (see server/Controllers/AuthController.cs). With the toggle gone `method` stays on its
              initial 'email' and every phone branch below is unreachable, so they are left in place
              rather than unpicked. Restore by uncommenting this, `switchMethod`, and the `setMethod`
              half of the useState above. */}
          {/*
          {!awaitingCode && (
            <div className="auth-methods">
              <button
                type="button"
                className={method === 'email' ? 'auth-method active' : 'auth-method'}
                aria-pressed={method === 'email'}
                onClick={() => switchMethod('email')}
              >
                <MailIcon />
                {t('auth.methodEmail')}
              </button>
              <button
                type="button"
                className={method === 'phone' ? 'auth-method active' : 'auth-method'}
                aria-pressed={method === 'phone'}
                onClick={() => switchMethod('phone')}
              >
                <PhoneIcon />
                {t('auth.methodPhone')}
              </button>
            </div>
          )}
          */}

          <form className="auth-form" onSubmit={handleSubmit}>
            {awaitingCode ? (
              <>
                <p className="auth-code-hint">{t('auth.codeSentTo', { phone: phone.trim() })}</p>

                <IconInput icon={<KeypadIcon />}>
                  <input
                    id="code"
                    className="auth-code-input"
                    type="text"
                    inputMode="numeric"
                    // Lets a phone offer the code straight from the message it just received.
                    autoComplete="one-time-code"
                    maxLength={CODE_LENGTH}
                    placeholder={t('auth.codeLabel')}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                  />
                </IconInput>

                <div className="auth-code-actions">
                  <button
                    type="button"
                    className="auth-forgot"
                    disabled={submitting || resendIn > 0}
                    onClick={requestCode}
                  >
                    {resendIn > 0
                      ? t('auth.resendCodeIn', { seconds: String(resendIn) })
                      : t('auth.resendCode')}
                  </button>
                  <button type="button" className="auth-forgot" onClick={resetCodeStep}>
                    {t('auth.changeNumber')}
                  </button>
                </div>
              </>
            ) : (
              <>
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

                {method === 'email' ? (
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
                ) : (
                  <IconInput icon={<PhoneIcon />}>
                    <input
                      id="phone"
                      type="tel"
                      placeholder={t('auth.phoneNumber')}
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </IconInput>
                )}

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
              </>
            )}

            {error && <div className="error-banner">{error}</div>}

            <button type="submit" className="btn auth-submit" disabled={submitting}>
              {submitLabel()}
            </button>

            {/* Google signs in with an email address, so it has nothing to offer mid-code. */}
            {!awaitingCode && (
              <>
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
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
