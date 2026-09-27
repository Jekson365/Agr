import { useLanguage } from '@/contexts/language-context';
import type { AuthMethod } from '@/pages/auth/auth-form-logic';
import { MailIcon, PhoneIcon } from '@/pages/auth/auth-icons';

export function AuthMethodToggle({ method, onChange }: { method: AuthMethod; onChange: (next: AuthMethod) => void }) {
  const { t } = useLanguage();

  return (
    <div className="auth-methods">
      <button
        type="button"
        className={method === 'phone' ? 'auth-method active' : 'auth-method'}
        aria-pressed={method === 'phone'}
        onClick={() => onChange('phone')}
      >
        <PhoneIcon />
        {t('auth.methodPhone')}
      </button>
      <button
        type="button"
        className={method === 'email' ? 'auth-method active' : 'auth-method'}
        aria-pressed={method === 'email'}
        onClick={() => onChange('email')}
      >
        <MailIcon />
        {t('auth.methodEmail')}
      </button>
    </div>
  );
}
