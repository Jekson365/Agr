import { useLanguage } from '@/contexts/language-context';

type Props = {
  error: string | null;
  saving: boolean;
  disabled: boolean;
  canGoBack: boolean;
  isLast: boolean;
  onBack: () => void;
  onNext: () => void;
};

export function OnboardingActions({ error, saving, disabled, canGoBack, isLast, onBack, onNext }: Props) {
  const { t } = useLanguage();

  return (
    <div className="onboarding-footer">
      {error && <div className="error-banner">{error}</div>}

      <div className="onboarding-footer-row">
        <button
          type="button"
          className="onboarding-nav-button"
          disabled={!canGoBack || saving}
          onClick={onBack}
        >
          ← {t('onboarding.back')}
        </button>

        <button
          type="button"
          className="btn onboarding-next"
          onClick={onNext}
          disabled={saving || disabled}
        >
          {saving ? '…' : isLast ? t('onboarding.finish') : t('onboarding.next')}
        </button>
      </div>
    </div>
  );
}
