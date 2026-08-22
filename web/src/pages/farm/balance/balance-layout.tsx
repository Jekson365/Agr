import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import { useLanguage } from '@/contexts/language-context';

type Props = {
  /** The area this balance belongs to — where the sidebar files it, and where the top link goes
   *  back to. Each holding reads its own balance from its own page rather than from a shared one. */
  backTo: string;
  backLabel: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  /**
   * The removed-holdings switch, for the holdings that can have any. Omitted where nothing behind
   * the table can be removed (greenhouse crops), since a switch that never turns anything up is
   * worse than no switch.
   */
  removed?: {
    /** Whether asking would turn anything up — the button is pointless on a farm that has removed
     *  nothing, and worse than pointless if pressing it appears to do nothing. */
    has: boolean;
    showing: boolean;
    onToggle: () => void;
  };
  actions?: ReactNode;
  children: ReactNode;
};

/**
 * The chrome every holding's balance page shares: where it sits, whether it loaded, and the switch
 * for the holdings the farm has removed. The table itself is the caller's — each holding derives
 * its balances differently (see product-balance.ts) and fetches only what its own table needs.
 */
export function BalanceLayout({ backTo, backLabel, loading, error, onRetry, removed, actions, children }: Props) {
  const { t } = useLanguage();

  return (
    <div>
      <Link to={backTo} className="back-link">
        ← {backLabel}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('farm.balance')}</h1>
        {!loading && !error && (
          <div className="balance-header-actions">
            {removed?.has && (
              <button
                type="button"
                className={
                  removed.showing ? 'add-button balance-removed-toggle active' : 'add-button balance-removed-toggle'
                }
                onClick={removed.onToggle}
                aria-pressed={removed.showing}
              >
                {t(removed.showing ? 'balance.hideRemoved' : 'balance.showRemoved')}
              </button>
            )}
            {actions}
          </div>
        )}
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('balance.loadError')}</span>
          <button type="button" className="retry-button" onClick={onRetry}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <div className="balance-panel">{children}</div>
      )}
    </div>
  );
}
