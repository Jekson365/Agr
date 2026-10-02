import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import '@/components/farm/kind-picker.css';
import '@/components/farm/search-filter.css';
import '@/pages/manager/manager-page.css';
import { useLanguage } from '@/contexts/language-context';
import { getVisitSummary } from '@/services/visit-service';
import type { VisitSummary } from '@/types/visit';
import { VisitorsBreakdowns } from './visitors-breakdowns';
import { VisitorsChart } from './visitors-chart';
import { VisitorsSessions } from './visitors-sessions';
import { VisitorsStats } from './visitors-stats';
import { VisitorsToolbar } from './visitors-toolbar';
import './visitors-page.css';

export function VisitorsPage() {
  const { t } = useLanguage();

  const [days, setDays] = useState(30);
  const [includeBots, setIncludeBots] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [summary, setSummary] = useState<VisitSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getVisitSummary({ days, includeBots })
      .then((result) => {
        if (!cancelled) setSummary(result);
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
  }, [days, includeBots, refreshKey]);

  return (
    <div className="visitors-page">
      <Link to="/manager" className="back-link">
        ← {t('manager.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('visitors.title')}</h1>
        <button
          type="button"
          className="retry-button"
          disabled={loading}
          onClick={() => setRefreshKey((key) => key + 1)}
        >
          {t('visitors.refresh')}
        </button>
      </div>

      <VisitorsToolbar
        days={days}
        onDays={setDays}
        includeBots={includeBots}
        onIncludeBots={setIncludeBots}
      />

      {error && <div className="error-banner visitors-error">{error}</div>}

      {!summary ? (
        loading && <div className="state-box">…</div>
      ) : (
        <div className={loading ? 'visitors-summary loading' : 'visitors-summary'}>
          <VisitorsStats summary={summary} />
          <VisitorsChart summary={summary} />
          <VisitorsBreakdowns summary={summary} />
        </div>
      )}

      <VisitorsSessions
        key={`${days}-${includeBots}`}
        days={days}
        includeBots={includeBots}
        refreshKey={refreshKey}
      />
    </div>
  );
}
