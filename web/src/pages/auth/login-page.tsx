import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import farmland from '@/assets/farmland-wide.webp';
import logo from '@/assets/logo.png';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { AuthFields } from '@/pages/auth/auth-fields';
import {
  authErrorMessage,
  EMPTY_VALUES,
  validateAuth,
  type AuthMethod,
  type AuthMode,
  type AuthValues,
} from '@/pages/auth/auth-form-logic';
import { GoogleIcon } from '@/pages/auth/auth-icons';
import { AuthMethodToggle } from '@/pages/auth/auth-method-toggle';
import { GOOGLE_CLIENT_ID, useGoogleButton } from '@/pages/auth/use-google-button';
import { homePathFor } from '@/routes/home-path';
import type { GoogleCredentialResponse } from '@/services/google-identity';
import './login-page.css';
import './auth-form.css';

export function LoginPage() {
  const { signIn, signUp, signInWithPhone, signUpWithPhone, signInWithGoogle, isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>(() =>
    (location.state as { mode?: AuthMode } | null)?.mode === 'register' ? 'register' : 'login'
  );
  const [method, setMethod] = useState<AuthMethod>('phone');
  const [values, setValues] = useState<AuthValues>(EMPTY_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const googleSlotRef = useGoogleButton(async (response: GoogleCredentialResponse) => {
    if (!response.credential) {
      setError(t('auth.errorGoogleSignIn'));
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle(response.credential);
    } catch (err) {
      console.error('[login] google sign-in failed:', err);
      setError(t('auth.errorGoogleSignIn'));
      setSubmitting(false);
    }
  });

  if (isAuthenticated) {
    return <Navigate to={homePathFor(user)} replace />;
  }

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
  };

  const switchMethod = (next: AuthMethod) => {
    setMethod(next);
    setError(null);
  };

  const updateValue = (field: keyof AuthValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const submit = () => {
    const name = values.name.trim();
    if (method === 'phone') {
      const phoneNumber = values.phone.trim();
      return mode === 'login'
        ? signInWithPhone(phoneNumber, values.password)
        : signUpWithPhone({ name, phoneNumber, password: values.password });
    }
    const email = values.email.trim();
    return mode === 'login'
      ? signIn(email, values.password)
      : signUp({ name, email, password: values.password });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const validationError = validateAuth(mode, method, values, t);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await submit();
    } catch (err) {
      setError(authErrorMessage(err, method, t));
    } finally {
      setSubmitting(false);
    }
  };

  const idleLabel = mode === 'login' ? t('auth.login') : t('auth.register');
  const busyLabel = mode === 'login' ? t('auth.signingIn') : t('auth.creatingAccount');

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

          <AuthMethodToggle method={method} onChange={switchMethod} />

          <form className="auth-form" onSubmit={handleSubmit}>
            <AuthFields mode={mode} method={method} values={values} onChange={updateValue} />

            {error && <div className="error-banner">{error}</div>}

            <button type="submit" className="btn auth-submit" disabled={submitting}>
              {submitting ? busyLabel : idleLabel}
            </button>

            <div className="auth-divider">
              <span className="auth-divider-line" />
              <span className="auth-divider-text">{t('auth.or')}</span>
              <span className="auth-divider-line" />
            </div>

            {GOOGLE_CLIENT_ID ? (
              <div ref={googleSlotRef} className="auth-google-slot" />
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
