import { useMemo } from 'react';

import { HarvestMoneyForm } from '@/components/harvest/harvest-money-form';
import { computeEconomics, type YieldRow } from '@/config/harvest-analysis';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import type { Harvest } from '@/types/harvest';
import { HarvestComparison } from './harvest-comparison';
import { buildHarvestKpiCards } from './harvest-kpi-cards';
import { yieldRawUnitFor, yieldTargetFor, type Catalogs } from './harvest-detail-lookups';
import './harvest-detail-money.css';
import './harvest-detail-panels.css';

type Props = {
  harvest: Harvest;
  yieldRows: YieldRow[];
  catalogs: Catalogs;
  plotArea: number | null;
  /** Chemicals are recorded in their own section, but their cost is part of this harvest's
   *  expenses — the page keeps the running total so both sections agree. */
  chemicalTotal: number;
  onHarvestSaved: (harvest: Harvest) => void;
};

/** Everything the harvest cost and earned, in one place: the figures, what was planned against
 *  what came off the field, and the chemicals applied. */
export function MoneySection({ harvest, yieldRows, catalogs, plotArea, chemicalTotal, onHarvestSaved }: Props) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const economics = useMemo(
    () =>
      computeEconomics(
        harvest,
        yieldRows,
        (row) => yieldRawUnitFor(catalogs, harvest.kind, row.stockId, row.treeStockId),
        plotArea,
        chemicalTotal
      ),
    [harvest, yieldRows, catalogs, plotArea, chemicalTotal]
  );

  const unitLabel = (() => {
    const row = yieldRows.find((r) => r.actual > 0);
    return row ? (yieldTargetFor(catalogs, harvest.kind, row.stockId, row.treeStockId, t)?.unitLabel ?? '') : '';
  })();

  const cards = buildHarvestKpiCards(economics, unitLabel, t, formatPrice);

  return (
    <>
      <section className="hd-panel">
        <h2 className="hd-panel-title">{t('harvest.moneyTitle')}</h2>

        {cards.length === 0 ? (
          <p className="hd-empty">{t('harvest.moneyEmpty')}</p>
        ) : (
          <div className="hd-money-grid">
            {cards.map((card) => (
              <div key={card.label} className="hd-money-card">
                <span className="hd-money-label">{card.label}</span>
                <span className={card.tone ? `hd-money-value ${card.tone}` : 'hd-money-value'}>{card.value}</span>
              </div>
            ))}
          </div>
        )}

        {economics.unit == null && economics.totalYield > 0 && <p className="hd-note">{t('harvest.kpiMixedUnitsHint')}</p>}

        <h3 className="hd-panel-subtitle">{t('harvest.expensesTitle')}</h3>
        <HarvestMoneyForm harvest={harvest} onSaved={onHarvestSaved} />
      </section>

      <HarvestComparison rows={yieldRows} catalogs={catalogs} />
    </>
  );
}
