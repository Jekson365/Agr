import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import '@/components/farm/tabs.css';
import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import {
  approvePremiumRequest,
  getAdminUsers,
  getPremiumRequests,
  rejectPremiumRequest,
} from '@/services/admin-service';
import type { AdminUser, PremiumRequest } from '@/types/admin';
import './manager-page.css';

type Tab = 'users' | 'premium';

/**
 * The platform operator's page: who has registered, and which listings are waiting to be promoted.
 *
 * Reachable only through {@link SuperAdminRoute}, and every request it makes is checked again on
 * the server — the guard decides what renders, not what is allowed.
 */
export function ManagerPage() {
  const { t, language } = useLanguage();

  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** The listing currently being approved or refused, so only its own buttons go quiet. */
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Both at once: the pending count belongs on the tab, so the page needs it before anyone
      // opens that tab.
      const [userList, requestList] = await Promise.all([getAdminUsers(), getPremiumRequests()]);
      setUsers(userList);
      setRequests(requestList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function decide(listingId: number, approve: boolean) {
    setBusyId(listingId);
    setError(null);
    try {
      if (approve) {
        await approvePremiumRequest(listingId);
      } else {
        await rejectPremiumRequest(listingId);
      }
      // Either way the request leaves the queue, so it goes from the list rather than being
      // refetched — the same patch-in-place the rest of the app uses after a mutation.
      setRequests((prev) => prev.filter((r) => r.listingId !== listingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyId(null);
    }
  }

  const term = search.trim().toLowerCase();
  const visibleUsers = term
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(term) ||
          `${u.name} ${u.surname}`.toLowerCase().includes(term) ||
          u.phoneNumber.toLowerCase().includes(term)
      )
    : users;

  return (
    <div>
      <Link to="/main" className="back-link">
        ← {t('dashboard.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('manager.title')}</h1>
      </div>

      <div className="tab-row">
        <button type="button" className={tab === 'users' ? 'tab-item active' : 'tab-item'} onClick={() => setTab('users')}>
          {t('manager.tabUsers')} ({users.length})
        </button>
        <button
          type="button"
          className={tab === 'premium' ? 'tab-item active' : 'tab-item'}
          onClick={() => setTab('premium')}
        >
          {t('manager.tabPremium')} ({requests.length})
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="state-box">…</div>
      ) : tab === 'users' ? (
        <>
          <input
            className="manager-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('manager.searchUsers')}
          />

          {visibleUsers.length === 0 ? (
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
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((u) => (
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : requests.length === 0 ? (
        <p className="empty-state">{t('manager.noPremiumRequests')}</p>
      ) : (
        <div className="manager-request-list">
          {requests.map((r) => {
            const title = r.title.trim() || r.itemType || '—';
            const cover = r.imagePaths[0];
            return (
              <div key={r.listingId} className="manager-request">
                <div className="manager-request-image">
                  {cover ? <img src={resolveAssetUrl(cover)} alt="" /> : <span>{title.charAt(0).toUpperCase()}</span>}
                </div>

                <div className="manager-request-body">
                  <div className="manager-request-title">{title}</div>
                  <div className="manager-user-sub">
                    {r.sellerName || '—'} · {r.sellerEmail || '—'}
                  </div>
                  <div className="manager-user-sub">
                    {r.price} {r.priceUnit && `/ ${r.priceUnit}`}
                    {r.location && ` · ${r.location}`}
                  </div>
                  <div className="manager-user-sub">
                    {t('manager.requestedOn')} {formatLocalizedIsoDate(r.requestedAt, language)}
                  </div>
                </div>

                <div className="manager-request-actions">
                  <Link to={`/market/${r.listingId}`} className="btn btn-secondary manager-view">
                    {t('manager.view')}
                  </Link>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={busyId === r.listingId}
                    onClick={() => decide(r.listingId, false)}
                  >
                    {t('manager.reject')}
                  </button>
                  <button
                    type="button"
                    className="btn manager-approve"
                    disabled={busyId === r.listingId}
                    onClick={() => decide(r.listingId, true)}
                  >
                    {busyId === r.listingId ? '…' : t('manager.approve')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
