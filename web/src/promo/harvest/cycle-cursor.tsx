import { TARGETS } from '@/promo/harvest/cycle-targets';
import { CLICK, CURSOR_IN, CURSOR_OUT } from '@/promo/harvest/cycle-timeline';
import { PointerTrail, type Visit } from '@/promo/harvest/pointer-trail';

const VISITS: Visit[] = [
  [CLICK.add, TARGETS.add],
  [CLICK.seed, TARGETS.seed],
  [CLICK.planting, TARGETS.stages[1]],
  [CLICK.emergence, TARGETS.stages[2]],
  [CLICK.flowering, TARGETS.stages[3]],
  [CLICK.ripening, TARGETS.stages[4]],
  [CLICK.ready, TARGETS.stages[5]],
  [CLICK.harvested, TARGETS.harvested, TARGETS.afterHarvest],
  [CLICK.overview, TARGETS.overview, TARGETS.overviewRest],
  [CLICK.grading, TARGETS.grading, TARGETS.gradingRest],
  [CLICK.chemicals, TARGETS.chemicals, TARGETS.chemicalsRest],
  [CLICK.balance, TARGETS.balance],
];

export function CycleCursor() {
  return <PointerTrail visits={VISITS} start={TARGETS.start} exit={TARGETS.exit} appearAt={CURSOR_IN} leaveAt={CURSOR_OUT} />;
}
