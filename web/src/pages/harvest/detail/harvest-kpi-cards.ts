import type { HarvestEconomics } from '@/config/harvest-analysis';
import { round2 } from './harvest-detail-lookups';

export type HarvestKpiCard = {
  label: string;
  value: string;
  tone?: 'positive' | 'negative';
};

type Translate = (key: string, params?: Record<string, string | number>) => string;

export function buildHarvestKpiCards(
  economics: HarvestEconomics,
  unitLabel: string,
  t: Translate,
  formatPrice: (amount: number) => string
): HarvestKpiCard[] {
  const cards: HarvestKpiCard[] = [];

  if (economics.totalYield > 0) {
    cards.push({
      label: t('harvest.kpiTotalYield'),
      value: economics.unit ? `${round2(economics.totalYield)} ${unitLabel}` : t('harvest.kpiMixedUnits'),
    });
  }
  if (economics.revenue > 0) {
    cards.push({ label: t('harvest.revenueLabel'), value: formatPrice(economics.revenue) });
  }
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

  return cards;
}
