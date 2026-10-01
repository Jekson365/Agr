import { HARVEST_STATUSES } from '@/config/harvest-status';
import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { tr } from '@/promo/locale';
import { easeOut, enter, fadeUp } from '@/promo/motion';
import { SAMPLE } from '@/promo/harvest/cycle-copy';
import { CycleHead, CycleKpi } from '@/promo/harvest/cycle-head';
import { CyclePanel } from '@/promo/harvest/cycle-panel';
import { CycleStages } from '@/promo/harvest/cycle-stages';
import {
  CUCUMBER,
  CUCUMBER_STAGE_DATES,
  HARVESTED_AT,
  NEW_ROW_AT,
  SEED_ROW_AT,
  TOMATO,
  TOMATO_STAGE_DATES,
  tomatoStatus,
} from '@/promo/harvest/cycle-timeline';

const SWITCH_AT = NEW_ROW_AT + 0.12;
const HARVESTED_INDEX = HARVEST_STATUSES.indexOf('Harvested');

function good(type: string) {
  return { name: stockTypeLabel(type, tr), icon: stockKindImage(type) };
}

function CucumberPane({ time }: { time: number }) {
  return (
    <>
      <CycleHead
        time={time}
        status="Flowering"
        since={-1}
        title={SAMPLE.cucumber}
        date={CUCUMBER.date}
        expected={CUCUMBER.expected}
        dueDays={CUCUMBER.dueDays}
        field={SAMPLE.field}
      />
      <CycleStages time={time} current={3} since={-1} dates={CUCUMBER_STAGE_DATES} blockedFrom={7} />
      <CyclePanel
        time={time}
        harvested={false}
        harvestedSince={0}
        good={good('Cucumber')}
        seedKg={CUCUMBER.seedKg}
        seedAt={-1}
        yieldKg={0}
      />
    </>
  );
}

function TomatoPane({ time }: { time: number }) {
  const { status, since } = tomatoStatus(time);
  const current = HARVEST_STATUSES.indexOf(status);
  const harvested = current >= HARVESTED_INDEX;
  const blockedFrom = time < SEED_ROW_AT ? 1 : harvested ? HARVEST_STATUSES.length : HARVEST_STATUSES.length - 1;

  return (
    <div style={fadeUp(time, SWITCH_AT, 22, 0.4)}>
      <CycleHead
        time={time}
        status={status}
        since={since}
        title={SAMPLE.tomato}
        date={TOMATO.date}
        expected={TOMATO.expected}
        dueDays={harvested ? null : TOMATO.dueDays}
        field={SAMPLE.field}
      />
      <CycleKpi
        open={enter(time, HARVESTED_AT, 0.45, easeOut)}
        count={enter(time, HARVESTED_AT + 0.15, 1, easeOut)}
        yieldKg={TOMATO.yieldKg}
        revenue={TOMATO.revenue}
        cost={TOMATO.cost}
      />
      <CycleStages time={time} current={current} since={since} dates={TOMATO_STAGE_DATES} blockedFrom={blockedFrom} />
      <CyclePanel
        time={time}
        harvested={harvested}
        harvestedSince={HARVESTED_AT}
        good={good('Tomato')}
        seedKg={TOMATO.seedKg}
        seedAt={SEED_ROW_AT}
        yieldKg={TOMATO.yieldKg}
      />
    </div>
  );
}

export function CyclePane({ time }: { time: number }) {
  return <div className="hw-pane">{time < SWITCH_AT ? <CucumberPane time={time} /> : <TomatoPane time={time} />}</div>;
}
