import type { ReactNode } from 'react';

import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { formatBytes } from '@/components/ui/format-bytes';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import { lastActiveLabel } from '@/pages/manager/last-active';
import { ManagerModulesCell } from '@/pages/manager/manager-modules-cell';
import { deviceLabel, placeLabel } from '@/pages/manager/visitors/visit-labels';
import type { AdminUser } from '@/types/admin';
import type { AdminSignInMethod, AdminUserActivity } from '@/types/admin-details';
import './user-detail-activity.css';

const SIGN_IN_LABEL_KEY: Record<AdminSignInMethod, string> = {
  Email: 'managerUser.signInEmail',
  Phone: 'managerUser.signInPhone',
  Google: 'managerUser.signInGoogle',
};

type Props = {
  user: AdminUser;
  activity: AdminUserActivity;
};

export function UserDetailActivity({ user, activity }: Props) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const visit = activity.lastVisit;
  const used = formatBytes(activity.storageUsedBytes);
  const storage =
    activity.storageLimitBytes == null
      ? t('profile.storageUsedUnlimited', { used })
      : t('profile.storageUsed', { used, limit: formatBytes(activity.storageLimitBytes) });

  const facts: { key: string; label: string; value: ReactNode }[] = [
    { key: 'last', label: t('managerUser.lastActive'), value: lastActiveLabel(user, language) },
    {
      key: 'device',
      label: t('managerUser.device'),
      value: visit ? [deviceLabel(visit.device, t), visit.browser, visit.os].filter(Boolean).join(' · ') : '—',
    },
    {
      key: 'place',
      label: t('managerUser.place'),
      value: visit ? placeLabel(visit.city, visit.countryCode, visit.country, language, t) : '—',
    },
    {
      key: 'visits',
      label: t('managerUser.visits'),
      value: t('managerUser.visitsValue', { sessions: activity.sessions, views: activity.pageViews }),
    },
    { key: 'signIn', label: t('managerUser.signIn'), value: t(SIGN_IN_LABEL_KEY[activity.signIn]) },
    { key: 'modules', label: t('manager.colModules'), value: <ManagerModulesCell user={user} /> },
    {
      key: 'farm',
      label: t('managerUser.farmCreated'),
      value: activity.farmCreatedAt ? formatLocalizedIsoDate(activity.farmCreatedAt, language) : '—',
    },
    { key: 'storage', label: t('profile.storageTitle'), value: storage },
    { key: 'neighbours', label: t('managerUser.neighbours'), value: String(activity.neighbours) },
    {
      key: 'sales',
      label: t('managerUser.sales'),
      value: activity.sales === 0 ? '0' : `${activity.sales} · ${formatPrice(activity.salesAmount)}`,
    },
  ];

  return (
    <section className="user-detail-card user-detail-activity-card">
      <h2 className="user-detail-title">{t('managerUser.activity')}</h2>
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
