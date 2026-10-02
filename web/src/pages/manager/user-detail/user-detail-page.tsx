import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import '@/pages/manager/manager-page.css';
import { useLanguage } from '@/contexts/language-context';
import { getUserOverview, migrateUserDatabase } from '@/services/admin-service';
import type { AdminUserOverview } from '@/types/admin';
import { UserDetailHeader } from './user-detail-header';
import { UserDetailHoldings } from './user-detail-holdings';
import './user-detail.css';

export function UserDetailPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const userId = Number(id);

  const [overview, setOverview] = useState<AdminUserOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getUserOverview(userId)
      .then((result) => {
        if (!cancelled) setOverview(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  async function updateDatabase() {
    setUpdating(true);
    setError(null);
    try {
      await migrateUserDatabase(userId);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="user-detail">
      <Link to="/manager" className="back-link">
        ← {t('manager.title')}
      </Link>

      {error && <div className="error-banner user-detail-error">{error}</div>}

      {!overview ? (
        loading && <div className="state-box">…</div>
      ) : (
        <>
          <UserDetailHeader user={overview.user} />

          {overview.database === 'Missing' && <p className="empty-state">{t('managerUser.noDatabase')}</p>}

          {overview.database === 'Outdated' && (
            <div className="user-detail-notice">
              <span>{t('managerUser.outdated')}</span>
              <button type="button" className="btn user-detail-update" disabled={updating} onClick={updateDatabase}>
                {updating ? '…' : t('managerUser.update')}
              </button>
            </div>
          )}

          {overview.database === 'Ready' && <UserDetailHoldings overview={overview} />}
        </>
      )}
    </div>
  );
}
