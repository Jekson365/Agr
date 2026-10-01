import harvestIcon from '@/assets/icons/harvest.png';
import { formatLocalizedIsoDay } from '@/components/ui/date-utils';
import { HARVEST_STATUS_BADGE_CLASS, HARVEST_STATUS_LABEL_KEY } from '@/config/harvest-status';
import { copy, LANGUAGE, tr } from '@/promo/locale';
import { backOut, enter, mix } from '@/promo/motion';
import type { HarvestStatus } from '@/types/harvest';

type HeadProps = {
  time: number;
  status: HarvestStatus;
  since: number;
  title: string;
  date: string;
  expected: string;
  dueDays: number | null;
  field: string;
};

export function CycleHead({ time, status, since, title, date, expected, dueDays, field }: HeadProps) {
  const pop = enter(time, since, 0.45, backOut);

  return (
    <div className="hw-head">
      <img className="hw-head-icon" src={harvestIcon} alt="" />
      <div className="hw-head-main">
        <span
          className={`${HARVEST_STATUS_BADGE_CLASS[status]} harvest-status-badge cycle-badge`}
          style={{ transform: `scale(${mix(0.7, 1, pop)})` }}
        >
          {tr(HARVEST_STATUS_LABEL_KEY[status])}
        </span>
        <h2 className="hw-head-title">{title}</h2>
        <div className="hd-facts hw-head-facts">
          <span className="hd-fact">
            {tr('harvest.date')}: <strong>{formatLocalizedIsoDay(date, LANGUAGE)}</strong>
          </span>
          <span className="hd-fact">
            {tr('harvest.expectedDate')}: <strong>{formatLocalizedIsoDay(expected, LANGUAGE)}</strong>
            {dueDays != null && <span> {tr('harvest.dueIn').replace('{days}', String(dueDays))}</span>}
          </span>
          <span className="hd-fact">
            {tr('harvest.landLabel')}: <strong>{field}</strong>
          </span>
        </div>
      </div>
      <div className="hw-head-actions">
        <button type="button" className="hd-button compact">
          {copy.common.edit}
        </button>
        <button type="button" className="hd-button compact danger">
          {copy.common.delete}
        </button>
      </div>
    </div>
  );
}

type KpiProps = {
  open: number;
  count: number;
  yieldKg: number;
  revenue: number;
  cost: number;
};

export function CycleKpi({ open, count, yieldKg, revenue, cost }: KpiProps) {
  const cards = [
    { label: tr('harvest.kpiTotalYield'), value: `${Math.round(yieldKg * count)} ${copy.farm.unitKg}` },
    { label: tr('harvest.revenueLabel'), value: `₾${Math.round(revenue * count)}` },
    { label: tr('harvest.expensesTotal'), value: `₾${Math.round(cost * count)}` },
    { label: tr('harvest.netTotal'), value: `₾${Math.round((revenue - cost) * count)}`, positive: true },
  ];

  return (
    <div className="cycle-grow" style={{ gridTemplateRows: `${open}fr`, opacity: open }}>
      <div className="cycle-grow-inner">
        <div className="hd-money-grid hw-kpi">
          {cards.map((card) => (
            <div key={card.label} className="hd-money-card">
              <span className="hd-money-label">{card.label}</span>
              <span className={card.positive ? 'hd-money-value positive' : 'hd-money-value'}>{card.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
