import { useEffect, useState } from 'react';

import { useLanguage } from '@/contexts/language-context';
import { getVisitSessions } from '@/services/visit-service';
import type { VisitSessionList } from '@/types/visit';
import { VisitorSessionRow } from './visitor-session-row';
import { formatCount } from './visit-labels';
import './visitors-sessions.css';

const PAGE_SIZE = 25;
const SEARCH_DELAY_MS = 350;

type Props = {
  days: number;
  includeBots: boolean;
  refreshKey: number;
};

export function VisitorsSessions({ days, includeBots, refreshKey }: Props) {
  const { t } = useLanguage();

  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [list, setList] = useState<VisitSessionList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const next = search.trim();
    if (next === term) return;
    const timer = window.setTimeout(() => {
      setTerm(next);
      setPage(1);
    }, SEARCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [search, term]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getVisitSessions({ days, includeBots, search: term || undefined, visitorId: visitorId ?? undefined }, page, PAGE_SIZE)
      .then((result) => {
        if (!cancelled) setList(result);
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
  }, [days, includeBots, term, visitorId, page, refreshKey]);

  function showVisitor(id: string | null) {
    setVisitorId(id);
    setPage(1);
    setOpenId(null);
  }

  const pages = list ? Math.max(1, Math.ceil(list.total / PAGE_SIZE)) : 1;

  return (
    <section className="visitors-panel visitors-sessions">
      <div className="visitors-sessions-head">
        <h2 className="visitors-panel-title">
          {t('visitors.sessionsTitle')}
          {list && ` · ${formatCount(list.total)}`}
        </h2>
        <input
          type="search"
          className="manager-search visitors-search"
          placeholder={t('visitors.searchPlaceholder')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {visitorId && (
        <div className="visitors-filter-chip">
          <span>{t('visitors.visitorFilter', { id: visitorId.slice(0, 8) })}</span>
          <button type="button" onClick={() => showVisitor(null)} aria-label={t('visitors.clearFilter')}>
            ×
          </button>
        </div>
      )}

      {error && <div className="error-banner visitors-error">{error}</div>}

      {!list ? (
        loading && <div className="state-box">…</div>
      ) : list.items.length === 0 ? (
        <p className="visitors-empty">{t('visitors.noSessions')}</p>
      ) : (
        <div className={loading ? 'manager-table-wrap visitors-table-wrap loading' : 'manager-table-wrap visitors-table-wrap'}>
          <table className="manager-table visitors-table">
            <thead>
              <tr>
                <th>{t('visitors.colTime')}</th>
                <th>{t('visitors.colLocation')}</th>
                <th>{t('visitors.colIp')}</th>
                <th>{t('visitors.colDevice')}</th>
                <th>{t('visitors.colSource')}</th>
                <th className="numeric">{t('visitors.colPages')}</th>
                <th>{t('visitors.colVisitor')}</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((session) => (
                <VisitorSessionRow
                  key={session.sessionId}
                  session={session}
                  open={openId === session.sessionId}
                  onToggle={() => setOpenId((current) => (current === session.sessionId ? null : session.sessionId))}
                  onVisitor={showVisitor}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {list && pages > 1 && (
        <div className="visitors-pager">
          <button type="button" className="retry-button" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>
            ← {t('visitors.previous')}
          </button>
          <span>{t('visitors.pageOf', { page, pages })}</span>
          <button type="button" className="retry-button" disabled={page >= pages || loading} onClick={() => setPage(page + 1)}>
            {t('visitors.next')} →
          </button>
        </div>
      )}
    </section>
  );
}
