import { HARVEST_STATUSES } from '@/config/harvest-status';
import { tr } from '@/promo/locale';
import { CycleHead, CycleKpi } from '@/promo/harvest/cycle-head';
import { CycleStages } from '@/promo/harvest/cycle-stages';
import { TOMATO_STAGE_DATES } from '@/promo/harvest/cycle-timeline';
import { SAMPLE } from '@/promo/reports/rpt-copy';
import { CLICK, TOMATO } from '@/promo/reports/rpt-timeline';

const TRANSFERRED_AT = CLICK.transfer + 0.04;

export function RptHarvestPage({ time }: { time: number }) {
  const transferred = time >= TRANSFERRED_AT;
  const status = transferred ? 'TransferredToBalance' : 'Harvested';
  const since = transferred ? TRANSFERRED_AT : -1;

  return (
    <div className="hw-page">
      <div className="page-header">
        <h1 className="page-title">{tr('harvest.title')}</h1>
        <button type="button" className="add-button">
          + {tr('harvest.add')}
        </button>
      </div>
      <div className="hw-pane">
        <CycleHead
          time={time}
          status={status}
          since={since}
          title={SAMPLE.tomatoTitle}
          date={TOMATO_STAGE_DATES[0]}
          expected={TOMATO_STAGE_DATES[7]}
          dueDays={null}
          field={SAMPLE.field}
        />
        <CycleKpi open={1} count={1} yieldKg={TOMATO.yieldKg} revenue={TOMATO.revenue} cost={TOMATO.cost} />
        <CycleStages
          time={time}
          current={HARVEST_STATUSES.indexOf(status)}
          since={since}
          dates={TOMATO_STAGE_DATES}
          blockedFrom={HARVEST_STATUSES.length}
        />
      </div>
    </div>
  );
}
