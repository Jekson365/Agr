import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import type { WineBatchSummary } from '@/types/wine';

type Props = {
  batch: WineBatchSummary;
};

export function WineMoneySection({ batch }: Props) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const profit = batch.revenue - batch.costs;
  const tiles = [
    { key: 'costs', label: t('wine.costs'), value: formatPrice(batch.costs) },
    { key: 'revenue', label: t('wine.revenue'), value: formatPrice(batch.revenue) },
    { key: 'profit', label: t('wine.profit'), value: formatPrice(profit) },
    {
      key: 'perLiter',
      label: t('wine.costPerLiter'),
      value: batch.producedLiters > 0 ? formatPrice(batch.costs / batch.producedLiters) : '—',
    },
    {
      key: 'perBottle',
      label: t('wine.costPerBottle'),
      value: batch.bottledCount > 0 ? formatPrice(batch.costs / batch.bottledCount) : '—',
    },
    { key: 'bottled', label: t('wine.bottled'), value: String(batch.bottledCount) },
  ];

  return (
    <section className="hd-panel">
      <h2 className="hd-panel-title">{t('wine.moneyTitle')}</h2>
      <p className="hd-note">{t('wine.moneyHint')}</p>
      <div className="wine-kpis">
        {tiles.map((tile) => (
          <div key={tile.key} className="wine-kpi">
            <span className="wine-kpi-label">{tile.label}</span>
            <strong className="wine-kpi-value">{tile.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
