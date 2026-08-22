import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import type { AdminUser } from '@/types/admin';

type Props = {
  users: AdminUser[];
  search: string;
  onSearch: (search: string) => void;
  /** Opens that account's feature switches — the operator grants areas, the account only reads them. */
  onConfigure: (user: AdminUser) => void;
  /** Lets an account into the farm software, or shuts it out. Absent for the operator's own row. */
  onManagementAccess: (user: AdminUser, value: boolean) => void;
  /** The row currently being written, so only its own control goes quiet. */
  busyId: number | null;
  operatorId: number | null;
};

export function ManagerUsersTable({
  users,
  search,
  onSearch,
  onConfigure,
  onManagementAccess,
  busyId,
  operatorId,
}: Props) {
  const { t, language } = useLanguage();

  return (
    <>
      <input
        className="manager-search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={t('manager.searchUsers')}
      />

      {users.length === 0 ? (
        <p className="empty-state">{t('manager.noUsers')}</p>
      ) : (
        <div className="manager-table-wrap">
          <table className="manager-table">
            <thead>
              <tr>
                <th>{t('manager.colUser')}</th>
                <th>{t('manager.colContact')}</th>
                <th>{t('manager.colPlan')}</th>
                <th className="numeric">{t('manager.colListings')}</th>
                <th>{t('manager.colJoined')}</th>
                <th>{t('manager.colFarmAccess')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="manager-user">
                      <span className="manager-avatar">
                        {u.imagePath ? (
                          <img src={resolveAssetUrl(u.imagePath)} alt="" />
                        ) : (
                          (u.name || u.email).charAt(0).toUpperCase()
                        )}
                      </span>
                      <span className="manager-user-text">
                        <span className="manager-user-name">
                          {`${u.name} ${u.surname}`.trim() || '—'}
                          {u.isSuperAdmin && <span className="manager-badge admin">{t('manager.superAdmin')}</span>}
                        </span>
                        <span className="manager-user-sub">{u.city || u.country || '—'}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="manager-user-sub">{u.email || '—'}</div>
                    <div className="manager-user-sub">
                      {u.phoneNumber || '—'}
                      {u.phoneVerified && <span className="manager-verified"> ✓</span>}
                    </div>
                  </td>
                  <td>{u.plan}</td>
                  <td className="numeric">{u.listingCount}</td>
                  <td className="manager-user-sub">{formatLocalizedIsoDate(u.createdAt, language)}</td>
                  <td>
                    {/* An operator changing their own would have no way back in, so their row
                        shows the state without offering to change it. */}
                    <label className="manager-access" title={t('manager.farmAccessHint')}>
                      <input
                        type="checkbox"
                        checked={u.hasManagementAccess}
                        disabled={busyId === u.id || u.id === operatorId}
                        onChange={(e) => onManagementAccess(u, e.target.checked)}
                      />
                      <span className="manager-user-sub">
                        {t(u.hasManagementAccess ? 'manager.farmAccessOn' : 'manager.farmAccessOff')}
                      </span>
                    </label>
                  </td>
                  <td>
                    <button type="button" className="btn btn-secondary manager-config-button" onClick={() => onConfigure(u)}>
                      {t('manager.configurations')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
