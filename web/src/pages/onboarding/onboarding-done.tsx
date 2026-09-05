import { useLanguage } from '@/contexts/language-context';
import './onboarding-done.css';

type Props = {
  onContinue: () => void;
};

export function OnboardingDone({ onContinue }: Props) {
  const { t } = useLanguage();

  return (
    <div className="onboarding-done">
      <span className="onboarding-done-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path className="onboarding-done-check" d="m4.5 12.5 5 5 10-11" />
        </svg>
      </span>

      <h2 className="onboarding-done-title">{t('onboarding.doneTitle')}</h2>
      <p className="onboarding-done-text">{t('onboarding.doneText')}</p>

      <button type="button" className="btn onboarding-done-action" onClick={onContinue}>
        {t('onboarding.doneAction')}
      </button>
    </div>
  );
}
