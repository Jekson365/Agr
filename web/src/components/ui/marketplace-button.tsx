import { NavLink } from 'react-router-dom';

import { useConfiguration } from '@/contexts/configuration-context';
import { useLanguage } from '@/contexts/language-context';
import { MARKETPLACE_CONFIG } from '@/types/configuration';
import './marketplace-button.css';

function MarketIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 5.5h19l1.5 4H1Z" />
      <path d="M4 9.5V20h16V9.5" />
      <path d="M9.5 20v-6h5v6" />
    </svg>
  );
}

/** The topbar's way into the marketplace, beside the neighbours button. */
export function MarketplaceButton() {
  const { t } = useLanguage();
  const { isOn } = useConfiguration();

  // Same gate as the route itself — a button onto a page the tenant can't open would be a dead end.
  if (!isOn(MARKETPLACE_CONFIG)) return null;

  const label = t('dashboard.marketplace');

  return (
    <NavLink
      to="/market"
      className={({ isActive }) => (isActive ? 'marketplace-button active' : 'marketplace-button')}
      aria-label={label}
      title={label}
    >
      <MarketIcon />
    </NavLink>
  );
}
