import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { copy, tr } from '@/promo/locale';
import { easeInOut, easeOut, enter, mix, popIn } from '@/promo/motion';
import { TARGETS } from '@/promo/harvest/cycle-targets';
import { CYCLE_OUTRO, STOCK_AT, TOMATO } from '@/promo/harvest/cycle-timeline';
import { windowFloat } from '@/promo/timeline';
import { useClock } from '@/promo/use-clock';

const CARD = { x: 1500, y: 790 };
const LANDING = { x: CARD.x + 120, y: CARD.y + 100 };

function FlyingAmount({ time, label }: { time: number; label: string }) {
  const start = STOCK_AT - 0.12;
  if (time < start || time > start + 0.62) return null;
  const p = enter(time, start, 0.6, easeInOut);
  const from = { x: TARGETS.balance.x, y: TARGETS.balance.y + windowFloat(time) };
  const arc = Math.sin(p * Math.PI) * -150;

  return (
    <span
      className="cycle-fly"
      style={{
        left: mix(from.x, LANDING.x, p),
        top: mix(from.y, LANDING.y, p) + arc,
        opacity: p < 0.85 ? 1 : (1 - p) / 0.15,
        transform: `translate(-50%, -50%) scale(${mix(0.9, 1.15, Math.sin(p * Math.PI))})`,
      }}
    >
      {label}
    </span>
  );
}

export function CycleStock() {
  const time = useClock();
  const shown = time >= STOCK_AT && time < CYCLE_OUTRO + 0.6;
  const count = enter(time, STOCK_AT + 0.25, 0.9, easeOut);
  const unit = copy.farm.unitKg;

  return (
    <>
      <FlyingAmount time={time} label={`+${TOMATO.yieldKg} ${unit}`} />
      <div
        className="cycle-stock"
        style={{ left: CARD.x, top: CARD.y, visibility: shown ? 'visible' : 'hidden', ...popIn(time, STOCK_AT, 0.55, 0.6) }}
      >
        <span className="cycle-stock-icon">
          <img src={stockKindImage('Tomato')} alt="" />
        </span>
        <span className="cycle-stock-text">
          <span className="cycle-stock-label">{tr('report.stockTab')}</span>
          <strong>{stockTypeLabel('Tomato', tr)}</strong>
          <span className="cycle-stock-amount">
            +{Math.round(TOMATO.yieldKg * count)} {unit}
          </span>
        </span>
        <span className="cycle-stock-chip" style={{ opacity: enter(time, STOCK_AT + 0.7, 0.35) }}>
          ✓ {tr('sales.balanceUpdated')}
        </span>
      </div>
    </>
  );
}
