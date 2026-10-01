import { copy } from '@/promo/locale';
import { easeOut, enter, mix } from '@/promo/motion';
import { CaptionBand } from '@/promo/harvest/cycle-captions';
import { PointerTrail, type Visit } from '@/promo/harvest/pointer-trail';
import { OutroScene } from '@/promo/outro-scene';
import { REPORT_CAPTIONS } from '@/promo/reports/rpt-copy';
import { RPT_TARGETS } from '@/promo/reports/rpt-targets';
import { CAPTION_STARTS, CLICK, CURSOR_IN, CURSOR_OUT, REPORTS_OUTRO, TOMATO } from '@/promo/reports/rpt-timeline';
import { RptWindow } from '@/promo/reports/rpt-window';
import { StageBackground } from '@/promo/stage-background';
import { windowFloat } from '@/promo/timeline';
import { useClock } from '@/promo/use-clock';

const VISITS: Visit[] = [
  [CLICK.transfer, RPT_TARGETS.transfer, RPT_TARGETS.afterTransfer],
  [CLICK.balance, RPT_TARGETS.balance, RPT_TARGETS.afterBalance],
  [CLICK.report, RPT_TARGETS.report, RPT_TARGETS.afterReport],
  [CLICK.harvestReport, RPT_TARGETS.harvestReport, RPT_TARGETS.afterHarvestReport],
  [CLICK.stockReport, RPT_TARGETS.stockReport, RPT_TARGETS.afterStockReport],
];

const CHIPS = [`+${TOMATO.yieldKg} ${copy.farm.unitKg}`, `+₾${TOMATO.revenue}`];

function TransferChips() {
  const time = useClock();
  const start = CLICK.transfer + 0.1;
  if (time < start || time > start + 1.4) return null;
  const p = enter(time, start, 1.4, easeOut);
  const origin = RPT_TARGETS.transfer;

  return (
    <>
      {CHIPS.map((label, index) => (
        <span
          key={label}
          className="cycle-fly"
          style={{
            left: origin.x + (index === 0 ? -90 : 90) * p,
            top: origin.y + windowFloat(time) - mix(10, 170, p) - index * 30 * p,
            opacity: p < 0.7 ? 1 : (1 - p) / 0.3,
            transform: `translate(-50%, -50%) scale(${mix(0.6, 1.1, Math.min(1, p * 3))})`,
          }}
        >
          {label}
        </span>
      ))}
    </>
  );
}

export function ReportsScenes() {
  return (
    <>
      <StageBackground />
      <CaptionBand captions={REPORT_CAPTIONS} starts={CAPTION_STARTS} end={REPORTS_OUTRO} />
      <RptWindow />
      <TransferChips />
      <PointerTrail visits={VISITS} start={RPT_TARGETS.start} exit={RPT_TARGETS.exit} appearAt={CURSOR_IN} leaveAt={CURSOR_OUT} />
      <OutroScene start={REPORTS_OUTRO} />
    </>
  );
}
