import { round2 } from '@/config/wine';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import '@/pages/harvest/detail/harvest-detail-panels.css';
import type { WineBatchSummary } from '@/types/wine';
import './wine-vintage.css';

type Props = {
  batches: WineBatchSummary[];
};

type Totals = { grapes: number; liters: number; bottled: number; costs: number; revenue: number };

function totalsByVintage(batches: WineBatchSummary[]): Map<number, Totals> {
  const totals = new Map<number, Totals>();
  for (const batch of batches) {
    const sum = totals.get(batch.vintage) ?? { grapes: 0, liters: 0, bottled: 0, costs: 0, revenue: 0 };
    sum.grapes += batch.grapeKg;
    sum.liters += batch.producedLiters;
    sum.bottled += batch.bottledCount;
    sum.costs += batch.costs;
    sum.revenue += batch.revenue;
    totals.set(batch.vintage, sum);
  }
  return totals;
}

export function WineVintageCompare({ batches }: Props) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const byVintage = totalsByVintage(batches.filter((batch) => !batch.isDeleted));
  const years = [...byVintage.keys()].sort((a, b) => b - a);
  if (years.length === 0) return null;

  if (years.length < 2) {
    return (
      <section className="hd-panel wine-vintage">
        <h2 className="hd-panel-title">{t('wine.vintageTitle')}</h2>
        <p className="hd-empty">{t('wine.vintageNeedsTwo')}</p>
      </section>
    );
  }

  const [current, previous] = years;
  const now = byVintage.get(current)!;
  const before = byVintage.get(previous)!;
  const amount = (unit: string) => (value: number) => `${round2(value)} ${unit}`;
  const rows = [
    { key: 'grapes', label: t('wine.grapesTitle'), format: amount(t('farm.unitKg')), upIsGood: true },
    { key: 'liters', label: t('wine.produced'), format: amount(t('wine.unitLiter')), upIsGood: true },
    { key: 'bottled', label: t('wine.bottled'), format: (value: number) => String(value), upIsGood: true },
    { key: 'costs', label: t('wine.costs'), format: formatPrice, upIsGood: false },
    { key: 'revenue', label: t('wine.revenue'), format: formatPrice, upIsGood: true },
  ] as const;

  return (
    <section className="hd-panel wine-vintage">
      <h2 className="hd-panel-title">{t('wine.vintageTitle')}</h2>
      <div className="wine-vintage-scroll">
        <table className="wine-vintage-table">
          <thead>
            <tr>
              <th />
              <th>{previous}</th>
              <th>{current}</th>
              <th>{t('wine.vintageChange')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const was = before[row.key];
              const is = now[row.key];
              const change = was > 0 ? Math.round(((is - was) / was) * 100) : null;
              const tone = change == null || change === 0 ? '' : (change > 0) === row.upIsGood ? 'is-good' : 'is-bad';
              return (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  <td className="is-previous">{row.format(was)}</td>
                  <td>{row.format(is)}</td>
                  <td>
                    {change == null ? (
                      '—'
                    ) : (
                      <span className={`wine-change ${tone}`}>
                        {change > 0 ? '▲' : change < 0 ? '▼' : '•'} {change > 0 ? '+' : ''}
                        {change}%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
