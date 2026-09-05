import mascotImage from '@/assets/mascot-intro.png';
import { useLanguage } from '@/contexts/language-context';
import './onboarding-welcome.css';

type Props = {
  onStart: () => void;
};

export function OnboardingWelcome({ onStart }: Props) {
  const { t } = useLanguage();

  return (
    <div className="onboarding-welcome">
      <div className="onboarding-welcome-mascot">
        <img src={mascotImage} alt={t('onboarding.welcomeMascotAlt')} />
      </div>

      <h1 className="onboarding-welcome-title">{t('onboarding.welcomeTitle')}</h1>
      <p className="onboarding-welcome-text">{t('onboarding.welcomeText')}</p>

      <button type="button" className="btn onboarding-welcome-action" onClick={onStart}>
        {t('onboarding.welcomeAction')}
      </button>
    </div>
  );
}
