import { useLanguage } from '@/contexts/language-context';
import type { AuthMethod, AuthMode, AuthValues } from '@/pages/auth/auth-form-logic';
import { IconInput, LockIcon, MailIcon, PersonIcon, PhoneIcon } from '@/pages/auth/auth-icons';

type Props = {
  mode: AuthMode;
  method: AuthMethod;
  values: AuthValues;
  onChange: (field: keyof AuthValues, value: string) => void;
};

export function AuthFields({ mode, method, values, onChange }: Props) {
  const { t } = useLanguage();

  return (
    <>
      {mode === 'register' && (
        <IconInput icon={<PersonIcon />}>
          <input
            id="name"
            type="text"
            placeholder={t('auth.fullName')}
            autoComplete="name"
            value={values.name}
            onChange={(e) => onChange('name', e.target.value)}
          />
        </IconInput>
      )}

      {method === 'phone' ? (
        <IconInput icon={<PhoneIcon />}>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder={t('auth.phoneNumber')}
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => onChange('phone', e.target.value)}
          />
        </IconInput>
      ) : (
        <IconInput icon={<MailIcon />}>
          <input
            id="email"
            type="email"
            placeholder={t('auth.email')}
            autoComplete="email"
            value={values.email}
            onChange={(e) => onChange('email', e.target.value)}
          />
        </IconInput>
      )}

      <IconInput icon={<LockIcon />}>
        <input
          id="password"
          type="password"
          placeholder={t('auth.password')}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={values.password}
          onChange={(e) => onChange('password', e.target.value)}
        />
      </IconInput>

      {mode === 'register' && (
        <IconInput icon={<LockIcon />}>
          <input
            id="confirmPassword"
            type="password"
            placeholder={t('auth.confirmPassword')}
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(e) => onChange('confirmPassword', e.target.value)}
          />
        </IconInput>
      )}

      {mode === 'login' && (
        <button type="button" className="auth-forgot">
          {t('auth.forgotPassword')}
        </button>
      )}
    </>
  );
}
