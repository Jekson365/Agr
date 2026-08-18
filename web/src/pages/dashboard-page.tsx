import { Link } from 'react-router-dom';

import { isNavItemVisible, QUICK_ACCESS_ITEMS } from '@/config/nav-items';
import { useAuth } from '@/contexts/auth-context';
import { useConfiguration } from '@/contexts/configuration-context';
import { useLanguage } from '@/contexts/language-context';
import './dashboard-page.css';

export function DashboardPage() {
  const { user } = useAuth();
  const { isOn } = useConfiguration();
  const { t } = useLanguage();

  return (
    <div>
      <h1 className="dashboard-greeting">{t('dashboard.greetingPopupMessage', { name: user?.name ?? '' })}</h1>

      <h2 className="dashboard-section-title">{t('dashboard.quickAccess')}</h2>
      <div className="quick-access-grid">
        {/* Same gating as the sidebar — a tile for an area the user can't reach would be a dead end. */}
        {QUICK_ACCESS_ITEMS.filter((item) => isNavItemVisible(item, user, isOn)).map(({ to, labelKey, icon }) => (
          <Link key={to} to={to} className="quick-access-item">
            <span className="quick-access-icon">
              <img src={icon} alt="" />
            </span>
            <span className="quick-access-label">{t(labelKey)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
