import { useCallback, useEffect, useState } from 'react';

import { NeighbourRow } from '@/components/neighbours/neighbour-row';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import {
  acceptNeighbourRequest,
  getNeighbourRequests,
  getNeighbours,
  removeNeighbour,
  searchNeighbours,
  sendNeighbourRequest,
} from '@/services/neighbour-service';
import type { Neighbour } from '@/types/neighbour';

import './neighbours.css';

type Tab = 'neighbours' | 'requests' | 'find';

/** How long to wait after the last keystroke before searching. */
const SEARCH_DEBOUNCE_MS = 300;

/** Shorter than this and the server answers nothing, so don't bother asking. */
const MIN_SEARCH_LENGTH = 2;

type Props = {
  open: boolean;
  onClose: () => void;
  /** Keeps the topbar badge honest while the panel is open and requests are being answered. */
  onPendingCountChange: (count: number) => void;
};

/** The neighbourhood, in a drawer on the right: who you farm alongside, who is waiting on you,
 *  and who else is out there. */
export function NeighboursPanel({ open, onClose, onPendingCountChange }: Props) {
  const { t } = useLanguage();
  const { refreshUser } = useAuth();

  const [tab, setTab] = useState<Tab>('neighbours');
  const [neighbours, setNeighbours] = useState<Neighbour[]>([]);
  const [requests, setRequests] = useState<Neighbour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [term, setTerm] = useState('');
  const [results, setResults] = useState<Neighbour[]>([]);
  const [searching, setSearching] = useState(false);

  /** The row with an action in flight — its buttons are held until the server answers. */
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [neighbourList, requestList] = await Promise.all([getNeighbours(), getNeighbourRequests()]);
      setNeighbours(neighbourList);
      setRequests(requestList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load]);

  // Closing on Escape, the way the drawer's own close button and its backdrop both do.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const incoming = requests.filter((request) => request.state === 'RequestReceived');
  const outgoing = requests.filter((request) => request.state === 'RequestSent');

  useEffect(() => {
    onPendingCountChange(incoming.length);
  }, [incoming.length, onPendingCountChange]);

  // Search as they type, once they've stopped.
  useEffect(() => {
    if (!open || tab !== 'find') return;

    const trimmed = term.trim();
    if (trimmed.length < MIN_SEARCH_LENGTH) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const found = await searchNeighbours(trimmed);
        // A slower earlier search must not overwrite the results of a later one.
        if (!cancelled) setResults(found);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term, tab, open]);

  /** Runs an action against one person, then brings both lists back in step with the server.
   *  The search results are patched in place instead, so a reply doesn't clear what was searched. */
  async function act(userId: number, action: () => Promise<Neighbour | void>) {
    setBusyUserId(userId);
    setError(null);
    try {
      const updated = await action();
      setResults((current) =>
        current.map((row) =>
          row.userId === userId ? (updated ?? { ...row, state: 'None', phoneNumber: '' }) : row,
        ),
      );
      const [neighbourList, requestList] = await Promise.all([getNeighbours(), getNeighbourRequests()]);
      setNeighbours(neighbourList);
      setRequests(requestList);

      // A new neighbour pays coins, so the balance in the sidebar has just gone stale. Kept off
      // the awaited path — the neighbourhood is what this panel is for, and a failed refresh
      // shouldn't report an error over a number the next page load will correct anyway.
      refreshUser().catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusyUserId(null);
    }
  }

  /** What can be done about someone, given where the two of you stand. Shared by all three tabs
   *  so a person offers the same choices wherever they are listed. */
  function actionsFor(neighbour: Neighbour) {
    switch (neighbour.state) {
      case 'Neighbour':
        return [
          {
            label: t('neighbours.remove'),
            danger: true,
            onClick: () => act(neighbour.userId, () => removeNeighbour(neighbour.userId)),
          },
        ];
      case 'RequestReceived':
        return [
          {
            label: t('neighbours.accept'),
            primary: true,
            onClick: () => act(neighbour.userId, () => acceptNeighbourRequest(neighbour.userId)),
          },
          {
            label: t('neighbours.decline'),
            danger: true,
            onClick: () => act(neighbour.userId, () => removeNeighbour(neighbour.userId)),
          },
        ];
      case 'RequestSent':
        return [
          {
            label: t('neighbours.cancel'),
            onClick: () => act(neighbour.userId, () => removeNeighbour(neighbour.userId)),
          },
        ];
      default:
        return [
          {
            label: t('neighbours.add'),
            primary: true,
            onClick: () => act(neighbour.userId, () => sendNeighbourRequest(neighbour.userId)),
          },
        ];
    }
  }

  function renderList(rows: Neighbour[], emptyMessage: string) {
    if (rows.length === 0) {
      return <p className="neighbours-empty">{emptyMessage}</p>;
    }
    return (
      <div className="neighbours-list">
        {rows.map((row) => (
          <NeighbourRow
            key={row.userId}
            neighbour={row}
            actions={actionsFor(row)}
            busy={busyUserId === row.userId}
          />
        ))}
      </div>
    );
  }

  if (!open) return null;

  return (
    <>
      <div className="neighbours-scrim" onClick={onClose} />
      <aside className="neighbours-panel" aria-label={t('neighbours.title')}>
        <header className="neighbours-panel-header">
          <h2 className="neighbours-panel-title">{t('neighbours.title')}</h2>
          <button type="button" className="neighbours-close" onClick={onClose} aria-label={t('common.close')}>
            ✕
          </button>
        </header>

        <nav className="neighbours-tabs">
          <button
            type="button"
            className={tab === 'neighbours' ? 'neighbours-tab active' : 'neighbours-tab'}
            onClick={() => setTab('neighbours')}
          >
            {t('neighbours.tabNeighbours')}
            {neighbours.length > 0 && <span className="neighbours-tab-count">{neighbours.length}</span>}
          </button>
          <button
            type="button"
            className={tab === 'requests' ? 'neighbours-tab active' : 'neighbours-tab'}
            onClick={() => setTab('requests')}
          >
            {t('neighbours.tabRequests')}
            {incoming.length > 0 && <span className="neighbours-tab-count alert">{incoming.length}</span>}
          </button>
          <button
            type="button"
            className={tab === 'find' ? 'neighbours-tab active' : 'neighbours-tab'}
            onClick={() => setTab('find')}
          >
            {t('neighbours.tabFind')}
          </button>
        </nav>

        <div className="neighbours-panel-body">
          {error && <div className="error-banner">{error}</div>}

          {loading ? (
            <div className="neighbours-loading">…</div>
          ) : tab === 'neighbours' ? (
            renderList(neighbours, t('neighbours.emptyNeighbours'))
          ) : tab === 'requests' ? (
            <>
              <h3 className="neighbours-section-title">{t('neighbours.incoming')}</h3>
              {renderList(incoming, t('neighbours.emptyIncoming'))}
              <h3 className="neighbours-section-title">{t('neighbours.outgoing')}</h3>
              {renderList(outgoing, t('neighbours.emptyOutgoing'))}
            </>
          ) : (
            <>
              <input
                className="neighbours-search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder={t('neighbours.searchPlaceholder')}
                autoFocus
              />
              {term.trim().length < MIN_SEARCH_LENGTH ? (
                <p className="neighbours-empty">{t('neighbours.searchHint')}</p>
              ) : searching ? (
                <div className="neighbours-loading">…</div>
              ) : (
                renderList(results, t('neighbours.noResults'))
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
