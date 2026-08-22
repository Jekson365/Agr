import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import '@/components/farm/tabs.css';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import {
  approvePremiumRequest,
  getAdminUsers,
  getPremiumRequests,
  rejectPremiumRequest,
  setManagementAccess,
} from '@/services/admin-service';
import type { AdminUser, PremiumRequest } from '@/types/admin';
import { ManagerPremiumList } from './manager-premium-list';
import { ManagerUsersTable } from './manager-users-table';
import { UserConfigurationsModal } from './user-configurations-modal';
import './manager-page.css';

type Tab = 'users' | 'premium';

/**
 * The platform operator's page: who has registered, and which listings are waiting to be promoted.
 *
 * Reachable only through {@link SuperAdminRoute}, and every request it makes is checked again on
 * the server — the guard decides what renders, not what is allowed.
 */
export function ManagerPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** The listing currently being approved or refused, so only its own buttons go quiet. */
  const [busyId, setBusyId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  /** The account whose feature switches are open. Theirs to have, the operator's to grant. */
  const [configuring, setConfiguring] = useState<AdminUser | null>(null);
  /** The row whose farm access is being written, so only its own checkbox goes quiet. */
  const [accessBusyId, setAccessBusyId] = useState<number | null>(null);

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

  async function changeAccess(user: AdminUser, value: boolean) {
    setAccessBusyId(user.id);
    setError(null);
    try {
      const updated = await setManagementAccess(user.id, value);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAccessBusyId(null);
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
      <Link to="/farm/land" className="back-link">
        ← {t('dashboard.myFarm')}
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
        <ManagerUsersTable
          users={visibleUsers}
          search={search}
          onSearch={setSearch}
          onConfigure={setConfiguring}
          onManagementAccess={changeAccess}
          busyId={accessBusyId}
          operatorId={user?.id ?? null}
        />
      ) : requests.length === 0 ? (
        <p className="empty-state">{t('manager.noPremiumRequests')}</p>
      ) : (
        <ManagerPremiumList requests={requests} busyId={busyId} onDecide={decide} />
      )}

      <UserConfigurationsModal user={configuring} onClose={() => setConfiguring(null)} />
    </div>
  );
}
