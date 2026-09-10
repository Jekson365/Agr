import { useEffect, useMemo } from 'react';

import harvestIcon from '@/assets/icons/harvest.png';
import '@/components/harvest/harvest.css';
import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { cropLabel } from '@/config/crop';
import { computeEconomics, countsInBalance, daysUntilExpected, isOverdue, isPicked } from '@/config/harvest-analysis';
import { HARVEST_STATUS_BADGE_CLASS, HARVEST_STATUS_LABEL_KEY } from '@/config/harvest-status';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import type { Harvest } from '@/types/harvest';
import { HarvestDetailBody } from '../detail/harvest-detail-body';
import { yieldRawUnitFor, yieldTargetFor } from '../detail/harvest-detail-lookups';
import { buildHarvestKpiCards } from '../detail/harvest-kpi-cards';
import { useHarvestDetail } from '../detail/use-harvest-detail';
import type { HarvestGoodSources } from './harvest-list-goods';
import '../detail/harvest-detail.css';
import '../detail/harvest-detail-panels.css';
import '../detail/harvest-detail-money.css';
import './harvest-detail-pane.css';

type Props = {
  harvestId: number;
  onEdit: (harvest: Harvest) => void;
  onDelete: (harvest: Harvest) => void;
  onHarvestChanged: (harvest: Harvest) => void;
  onGoodsChanged: (harvestId: number, sources: HarvestGoodSources) => void;
};

export function HarvestDetailPane({ harvestId, onEdit, onDelete, onHarvestChanged, onGoodsChanged }: Props) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const detail = useHarvestDetail(harvestId);
  const { harvest, catalogs, yieldRows } = detail;

  useEffect(() => {
    if (harvest) onHarvestChanged(harvest);
  }, [harvest, onHarvestChanged]);

  const { items, results, harvestTrees } = detail;

  useEffect(() => {
    onGoodsChanged(harvestId, { items, results, trees: harvestTrees });
  }, [harvestId, items, results, harvestTrees, onGoodsChanged]);

  const economics = useMemo(
    () =>
      harvest
        ? computeEconomics(
            harvest,
            yieldRows,
            (row) => yieldRawUnitFor(catalogs, harvest.kind, row.stockId, row.treeStockId),
            detail.plot?.area ?? null,
            detail.chemicalTotal
          )
        : null,
    [harvest, yieldRows, catalogs, detail.plot, detail.chemicalTotal]
  );

  if (detail.loading) return <div className="hw-pane state-box">…</div>;

  if (detail.error || !harvest) {
    return (
      <div className="hw-pane state-box">
        <span>{t('harvestItem.loadError')}</span>
        <button type="button" className="retry-button" onClick={detail.load}>
          {t('common.retry')}
        </button>
      </div>
    );
  }

  const unitLabel = (() => {
    const row = yieldRows.find((r) => r.actual > 0);
    return row ? (yieldTargetFor(catalogs, harvest.kind, row.stockId, row.treeStockId, t)?.unitLabel ?? '') : '';
  })();

  const cards = economics ? buildHarvestKpiCards(economics, unitLabel, t, formatPrice).slice(0, 4) : [];
  const overdue = isOverdue(harvest);
  const daysLeft = daysUntilExpected(harvest);
  const settled = countsInBalance(harvest.status);

  return (
    <div className="hw-pane">
      <div className="hw-head">
        <img src={harvestIcon} alt="" className="hw-head-icon" />

        <div className="hw-head-main">
          <span className={`${HARVEST_STATUS_BADGE_CLASS[harvest.status]} harvest-status-badge`}>
            {t(HARVEST_STATUS_LABEL_KEY[harvest.status])}
          </span>
          <h2 className="hw-head-title">{harvest.title}</h2>

          <div className="hd-facts hw-head-facts">
            <span className="hd-fact">
              {t('harvest.date')}: <strong>{formatLocalizedIsoDate(harvest.date, language)}</strong>
            </span>

            {harvest.expectedHarvestDate && (
              <span className="hd-fact">
                {t('harvest.expectedDate')}:{' '}
                <strong>{formatLocalizedIsoDate(harvest.expectedHarvestDate, language)}</strong>{' '}
                {overdue ? (
                  <span className="hd-fact-warn">{t('harvest.overdueBy', { days: Math.abs(daysLeft ?? 0) })}</span>
                ) : !isPicked(harvest.status) && daysLeft != null ? (
                  <span>{t('harvest.dueIn', { days: daysLeft })}</span>
                ) : null}
              </span>
            )}

            {detail.farm && (
              <span className="hd-fact">
                {t('harvest.landLabel')}:{' '}
                <strong>
                  {detail.farm.name}
                  {detail.plot ? ` · ${cropLabel(detail.plot.crop, t)} (${detail.plot.area} ${t('farm.areaUnit')})` : ''}
                </strong>
              </span>
            )}
          </div>
        </div>

        <div className="hw-head-actions">
          <button
            type="button"
            className="hd-button compact"
            disabled={settled}
            onClick={() => onEdit(harvest)}
          >
            {t('common.edit')}
          </button>
          <button
            type="button"
            className="hd-button compact danger"
            disabled={settled}
            onClick={() => onDelete(harvest)}
          >
            {t('common.delete')}
          </button>
        </div>
      </div>

      {cards.length > 0 && (
        <div className="hd-money-grid hw-kpi">
          {cards.map((card) => (
            <div key={card.label} className="hd-money-card">
              <span className="hd-money-label">{card.label}</span>
              <span className={card.tone ? `hd-money-value ${card.tone}` : 'hd-money-value'}>{card.value}</span>
            </div>
          ))}
        </div>
      )}

      <HarvestDetailBody harvestId={harvestId} harvest={harvest} detail={detail} nav="tabs" />
    </div>
  );
}
