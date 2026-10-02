import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { STORAGE_PLAN_LABEL_KEY } from '@/config/plan-benefits';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import type { AdminUser } from '@/types/admin';

type Props = {
  user: AdminUser;
};

export function UserDetailHeader({ user }: Props) {
  const { t, language } = useLanguage();

  const name = `${user.name} ${user.surname}`.trim() || user.email || user.phoneNumber || `#${user.id}`;
  const contact = [user.email, user.phoneNumber].filter(Boolean).join(' · ');
  const place = [user.city, user.country].filter(Boolean).join(', ');
  const facts = [
    { key: 'plan', label: t('manager.colPlan'), value: t(STORAGE_PLAN_LABEL_KEY[user.plan]) },
    { key: 'listings', label: t('manager.colListings'), value: String(user.listingCount) },
    { key: 'coins', label: t('managerUser.coins'), value: String(user.coins) },
    { key: 'joined', label: t('manager.colJoined'), value: formatLocalizedIsoDate(user.createdAt, language) },
    {
      key: 'access',
      label: t('manager.colFarmAccess'),
      value: t(user.hasManagementAccess ? 'manager.farmAccessOn' : 'manager.farmAccessOff'),
    },
  ];

  return (
    <section className="user-detail-card user-detail-header">
      <div className="user-detail-identity">
        <span className="manager-avatar user-detail-avatar">
          {user.imagePath ? <img src={resolveAssetUrl(user.imagePath)} alt="" /> : name.charAt(0).toUpperCase()}
        </span>
        <div className="user-detail-who">
          <h1 className="page-title user-detail-name">
            {name}
            {user.isSuperAdmin && <span className="manager-badge admin">{t('manager.superAdmin')}</span>}
          </h1>
          <div className="manager-user-sub">
            {contact || '—'}
            {user.phoneVerified && <span className="manager-verified"> ✓</span>}
          </div>
          {place && <div className="manager-user-sub">{place}</div>}
        </div>
      </div>

      <dl className="user-detail-facts">
        {facts.map((fact) => (
          <div key={fact.key} className="user-detail-fact">
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
