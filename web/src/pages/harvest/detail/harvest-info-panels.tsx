import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { cropLabel } from '@/config/crop';
import { HARVEST_STATUS_LABEL_KEY } from '@/config/harvest-status';
import { useLanguage } from '@/contexts/language-context';
import type { Harvest } from '@/types/harvest';
import { round2, seedInfoFor } from './harvest-detail-lookups';
import type { HarvestDetail } from './use-harvest-detail';
import './harvest-overview.css';

type Row = { label: string; value: string };

type Props = {
  harvest: Harvest;
  detail: HarvestDetail;
};

export function HarvestInfoPanels({ harvest, detail }: Props) {
  const { t, language } = useLanguage();
  const { farm, plot, harvestSeeds, catalogs } = detail;

  const dash = '—';

  const sown = harvestSeeds
    .map((used) => {
      const info = seedInfoFor(catalogs, used.seedId, t);
      return info ? `${info.label} · ${round2(used.amount)} ${info.unitLabel}` : null;
    })
    .filter((line): line is string => line != null)
    .join(', ');

  const harvestRows: Row[] = [
    { label: t('harvest.date'), value: formatLocalizedIsoDate(harvest.date, language) },
    {
      label: t('harvest.expectedDate'),
      value: harvest.expectedHarvestDate ? formatLocalizedIsoDate(harvest.expectedHarvestDate, language) : dash,
    },
    { label: t('harvest.statusLabel'), value: t(HARVEST_STATUS_LABEL_KEY[harvest.status]) },
    { label: t('harvestSeed.title'), value: sown || dash },
  ];

  const fieldRows: Row[] = [
    { label: t('harvest.landLabel'), value: farm?.name.trim() || dash },
    { label: t('farm.location'), value: farm?.location.trim() || dash },
    { label: t('farm.crop'), value: plot ? cropLabel(plot.crop, t) : dash },
    { label: t('farm.area'), value: plot ? `${round2(plot.area)} ${t('farm.areaUnit')}` : dash },
  ];

  return (
    <div className="hv-info-grid">
      <section className="hd-panel">
        <h2 className="hd-panel-title">{t('harvest.infoTitle')}</h2>
        <InfoList rows={harvestRows} />
      </section>

      <section className="hd-panel">
        <h2 className="hd-panel-title">{t('harvest.fieldInfoTitle')}</h2>
        <InfoList rows={fieldRows} />
      </section>
    </div>
  );
}

function InfoList({ rows }: { rows: Row[] }) {
  return (
    <dl className="hv-info">
      {rows.map((row) => (
        <div key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
