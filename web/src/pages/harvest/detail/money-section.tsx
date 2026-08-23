import { useMemo, useState } from 'react';

import { HarvestExpensesModal } from '@/components/harvest/harvest-expenses-modal';
import { buildYieldRows, computeEconomics } from '@/config/harvest-analysis';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import type { Harvest } from '@/types/harvest';
import type { HarvestItem } from '@/types/harvest-item';
import type { HarvestResult } from '@/types/harvest-result';
import { HarvestComparison } from './harvest-comparison';
import { rawUnitFor, round2, targetFor, type Catalogs } from './harvest-detail-lookups';
import './harvest-detail-money.css';
import './harvest-detail-panels.css';

type Props = {
  harvest: Harvest;
  items: HarvestItem[];
  results: HarvestResult[];
  catalogs: Catalogs;
  plotArea: number | null;
  /** Chemicals are recorded in their own section, but their cost is part of this harvest's
   *  expenses — the page keeps the running total so both sections agree. */
  chemicalTotal: number;
  onHarvestSaved: (harvest: Harvest) => void;
};

/** Everything the harvest cost and earned, in one place: the figures, what was planned against
 *  what came off the field, and the chemicals applied. */
export function MoneySection({ harvest, items, results, catalogs, plotArea, chemicalTotal, onHarvestSaved }: Props) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const [expensesOpen, setExpensesOpen] = useState(false);

  const yieldRows = useMemo(() => buildYieldRows(items, results), [items, results]);

  const economics = useMemo(
    () =>
      computeEconomics(
        harvest,
        yieldRows,
        (row) => rawUnitFor(catalogs, row.stockId, row.treeStockId),
        plotArea,
        chemicalTotal
      ),
    [harvest, yieldRows, catalogs, plotArea, chemicalTotal]
  );

  const unitLabel = (() => {
    const row = yieldRows.find((r) => r.actual > 0);
    return row ? (targetFor(catalogs, row.stockId, row.treeStockId, t)?.unitLabel ?? '') : '';
  })();

  const cards: { label: string; value: string; tone?: 'positive' | 'negative' }[] = [];
  if (economics.totalYield > 0) {
    cards.push({
      label: t('harvest.kpiTotalYield'),
      value: economics.unit ? `${round2(economics.totalYield)} ${unitLabel}` : t('harvest.kpiMixedUnits'),
    });
  }
  if (economics.revenue > 0) cards.push({ label: t('harvest.revenueLabel'), value: formatPrice(economics.revenue) });
  if (economics.totalExpenses > 0) {
    cards.push({ label: t('harvest.expensesTotal'), value: formatPrice(economics.totalExpenses) });
  }
  if (economics.revenue > 0 || economics.totalExpenses > 0) {
    cards.push({
      label: t('harvest.netTotal'),
      value: formatPrice(economics.net),
      tone: economics.net < 0 ? 'negative' : 'positive',
    });
  }
  if (economics.yieldPerArea != null) {
    cards.push({
      label: t('harvest.kpiYieldPerArea'),
      value: `${round2(economics.yieldPerArea)} ${unitLabel}/${t('farm.areaUnit')}`,
    });
  }
  if (economics.costPerUnit != null) {
    cards.push({ label: t('harvest.kpiCostPerUnit', { unit: unitLabel }), value: formatPrice(economics.costPerUnit) });
  }
  if (economics.revenuePerUnit != null) {
    cards.push({
      label: t('harvest.kpiRevenuePerUnit', { unit: unitLabel }),
      value: formatPrice(economics.revenuePerUnit),
    });
  }
  if (economics.netPerArea != null) {
    cards.push({
      label: t('harvest.kpiNetPerArea', { unit: t('farm.areaUnit') }),
      value: formatPrice(economics.netPerArea),
      tone: economics.netPerArea < 0 ? 'negative' : 'positive',
    });
  }

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

        <button type="button" className="hd-button primary" onClick={() => setExpensesOpen(true)}>
          {t('harvest.expensesTitle')}
        </button>
      </section>

      <HarvestComparison rows={yieldRows} catalogs={catalogs} />

      <HarvestExpensesModal
        harvest={harvest}
        open={expensesOpen}
        onClose={() => setExpensesOpen(false)}
        onSaved={onHarvestSaved}
      />
    </>
  );
}
