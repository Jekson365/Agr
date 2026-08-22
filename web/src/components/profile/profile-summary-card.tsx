import { PersonIcon } from '@/components/icons/misc-icons';
import { formatBytes } from '@/components/ui/format-bytes';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import type { StoragePlan } from '@/types/auth';
import '@/pages/profile-page.css';

const STORAGE_PLAN_LABEL_KEY: Record<StoragePlan, string> = {
  Free: 'profile.planFree',
  Medium: 'profile.planMedium',
  Premium: 'profile.planPremium',
};

function countLabel(max: number | null, t: (key: string) => string): string {
  return max == null ? t('profile.limitUnlimited') : String(max);
}

export function ProfileSummaryCard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const fullName = [user?.name, user?.surname].filter(Boolean).join(' ') || user?.name || '';
  const initials = fullName
    .split(' ')
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleLabel = user?.role === 'Owner' ? t('profile.roleOwner') : t('profile.roleMember');

  const limitRows = user
    ? [
        { label: t('profile.limitLand'), value: countLabel(user.maxLand, t), muted: false },
        { label: t('profile.limitLivestock'), value: countLabel(user.maxLivestockKinds, t), muted: false },
        { label: t('profile.limitStock'), value: countLabel(user.maxStockKinds, t), muted: false },
        { label: t('profile.limitFruit'), value: countLabel(user.maxFruitKinds, t), muted: false },
        {
          label: t('profile.limitBalance'),
          value: t(user.balanceAllowed ? 'profile.limitIncluded' : 'profile.limitNotIncluded'),
          muted: !user.balanceAllowed,
        },
        {
          label: t('profile.limitEquipment'),
          value: t(user.equipmentAllowed ? 'profile.limitIncluded' : 'profile.limitNotIncluded'),
          muted: !user.equipmentAllowed,
        },
      ]
    : [];

  return (
    <aside className="profile-summary-card">
      <div className="profile-avatar">
        {user?.imagePath ? (
          <img src={resolveAssetUrl(user.imagePath)} alt="" />
        ) : initials ? (
          <span className="profile-avatar-initials">{initials}</span>
        ) : (
          <PersonIcon width={28} height={28} />
        )}
      </div>
      <div className="profile-name">{fullName || user?.name}</div>

      {(user?.farmName || user?.farmImagePath) && (
        <div className="profile-farm">
          {user.farmImagePath && <img className="profile-farm-icon" src={resolveAssetUrl(user.farmImagePath)} alt="" />}
          {user.farmName && <span className="profile-farm-name">{user.farmName}</span>}
        </div>
      )}

      <div className="profile-badge">{roleLabel}</div>

      {user && (
        <div className="profile-storage">
          <div className="profile-storage-header">
            <span className="profile-badge">{t(STORAGE_PLAN_LABEL_KEY[user.plan] ?? STORAGE_PLAN_LABEL_KEY.Free)}</span>
            <span className="profile-storage-text">
              {user.storageLimitBytes == null
                ? t('profile.storageUsedUnlimited', { used: formatBytes(user.storageUsedBytes) })
                : t('profile.storageUsed', {
                    used: formatBytes(user.storageUsedBytes),
                    limit: formatBytes(user.storageLimitBytes),
                  })}
            </span>
          </div>

          {user.storageLimitBytes != null && (
            <div className="profile-storage-track">
              <div
                className="profile-storage-fill"
                style={{ width: `${Math.min(100, (user.storageUsedBytes / user.storageLimitBytes) * 100)}%` }}
              />
            </div>
          )}

          <div className="profile-limits-title">{t('profile.planLimitsTitle')}</div>
          {limitRows.map((row) => (
            <div key={row.label} className="profile-limit-row">
              <span className="profile-limit-label">{row.label}</span>
              <span className={row.muted ? 'profile-limit-value muted' : 'profile-limit-value'}>{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
