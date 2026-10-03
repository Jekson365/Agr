import mascotImage from '@/assets/mascot-intro.png';

import { useLanguage } from '@/contexts/language-context';
import './onboarding-loading.css';

export function OnboardingLoading() {
  const { t } = useLanguage();

  return (
    <div className="onboarding-loading" role="status" aria-live="polite">
      <span className="onboarding-loading-art">
        <span className="onboarding-loading-ring" aria-hidden="true" />
        <img src={mascotImage} alt="" />
      </span>
      <h2 className="onboarding-loading-title">{t('onboarding.loadingTitle')}</h2>
      <p className="onboarding-loading-text">{t('onboarding.loadingText')}</p>
    </div>
  );
}
