import { useLanguage } from '@/contexts/language-context';
import type { VisitSummary } from '@/types/visit';
import { formatCount } from './visit-labels';

type Props = {
  summary: VisitSummary;
};

export function VisitorsStats({ summary }: Props) {
  const { t } = useLanguage();

  const perSession = summary.sessions > 0 ? (summary.pageViews / summary.sessions).toFixed(1) : '0';
  const tiles = [
    { key: 'visitors', label: t('visitors.statVisitors'), value: formatCount(summary.visitors) },
    { key: 'sessions', label: t('visitors.statSessions'), value: formatCount(summary.sessions) },
    { key: 'views', label: t('visitors.statPageViews'), value: formatCount(summary.pageViews) },
    { key: 'depth', label: t('visitors.statPerSession'), value: perSession },
    { key: 'returning', label: t('visitors.statReturning'), value: formatCount(summary.returningVisitors) },
    { key: 'signedIn', label: t('visitors.statSignedIn'), value: formatCount(summary.signedInUsers) },
    { key: 'bots', label: t('visitors.statBots'), value: formatCount(summary.bots) },
  ];

  return (
    <div className="visitors-stats">
      {tiles.map((tile) => (
        <div key={tile.key} className={tile.key === 'visitors' ? 'visitors-stat primary' : 'visitors-stat'}>
          <span className="visitors-stat-value">{tile.value}</span>
          <span className="visitors-stat-label">{tile.label}</span>
        </div>
      ))}
    </div>
  );
}
