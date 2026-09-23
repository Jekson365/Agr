import { formatLocalizedIsoDay, todayIsoDate } from '@/components/ui/date-utils';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import type { FarmExportData } from './use-farm-export';

function total(values: number[]): number {
  return Math.round(values.reduce((sum, value) => sum + value, 0) * 100) / 100;
}

export function ExportSummary({ data }: { data: FarmExportData }) {
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const active = data.farms.filter((farm) => !farm.isRemoved);
  const owner = [user?.name, user?.surname].filter(Boolean).join(' ').trim();
  const place = [user?.city, user?.country].filter(Boolean).join(', ');
  const date = formatLocalizedIsoDay(todayIsoDate(), language, { year: true });

  const stats = [
    { key: 'lands', label: t('farm.land'), value: String(active.length) },
    { key: 'area', label: t('farm.area'), value: `${total(active.map((farm) => farm.area))} ${t('farm.areaUnit')}` },
    { key: 'plots', label: t('export.plots'), value: String(data.plots.length) },
    { key: 'stock', label: t('farm.plantStock'), value: String(data.stock.length) },
    { key: 'fruits', label: t('farm.fruits'), value: String(data.treeStock.length) },
    { key: 'herds', label: t('farm.livestock'), value: String(total(data.livestock.map((group) => group.count))) },
  ];

  return (
    <>
      <header className="fx-head">
        <div className="fx-head-who">
          <h2 className="fx-farm-name">{user?.farmName.trim() || t('farm.title')}</h2>
          {owner && <p className="fx-head-line">{t('export.owner')}: {owner}</p>}
          {place && <p className="fx-head-line">{place}</p>}
          {user?.phoneNumber && <p className="fx-head-line">{user.phoneNumber}</p>}
        </div>
        <p className="fx-generated">{t('export.generated', { date })}</p>
      </header>

      <div className="fx-stats">
        {stats.map((stat) => (
          <div key={stat.key} className="fx-stat">
            <span className="fx-stat-value">{stat.value}</span>
            <span className="fx-stat-label">{stat.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}
