import { STORAGE_PLAN_LABEL_KEY } from '@/config/plan-benefits';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import '@/components/farm/plan/plan-limit.css';

function UpgradeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V6" />
      <path d="m6 11 6-6 6 6" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function UpgradeTile({ resource, onClick }: { resource: string; onClick: () => void }) {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <button type="button" className="upgrade-tile" onClick={onClick}>
      <span className="upgrade-tile-icon">
        <UpgradeIcon />
      </span>
      <strong className="upgrade-tile-title">{t('plans.title')}</strong>
      <span className="upgrade-tile-text">{t('plans.limitReached', { resource })}</span>
      {user && (
        <span className="upgrade-tile-plan">
          {t('plans.current')}: {t(STORAGE_PLAN_LABEL_KEY[user.plan])}
        </span>
      )}
      <span className="upgrade-tile-cta">{t('landing.packets.cta')} →</span>
    </button>
  );
}
