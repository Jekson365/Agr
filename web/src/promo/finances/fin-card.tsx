import purchasesIcon from '@/assets/icons/purchases.png';
import sellsIcon from '@/assets/icons/sells.png';
import { tr } from '@/promo/locale';
import { backOut, easeIn, easeInOut, easeOut, enter, mix, popIn, wave } from '@/promo/motion';
import { PurchasesFace, SalesFace } from '@/promo/finances/fin-faces';
import { STOCK_CHANGES } from '@/promo/finances/fin-sample';
import { BEAT, SWITCH_TIME } from '@/promo/finances/fin-timeline';

const TABS = [
  { icon: purchasesIcon, label: 'purchase.title' },
  { icon: sellsIcon, label: 'sales.title' },
];

function Sticker({ time }: { time: number }) {
  const switched = time >= BEAT.toSales + 0.15;
  const flip = switched ? enter(time, BEAT.toSales + 0.15, 0.5, backOut) : enter(time, BEAT.sticker, 0.6, backOut);
  const leave = enter(time, BEAT.toast - 0.3, 0.3, easeIn);
  if (time < BEAT.sticker || leave >= 1) return null;

  return (
    <img
      className="social-sticker fin-sticker"
      src={switched ? sellsIcon : purchasesIcon}
      alt=""
      style={{
        opacity: Math.min(1, flip * 1.5) * (1 - leave),
        transform: `translateY(${wave(time, 3.2, 8)}px) rotate(${8 + wave(time, 4, 3)}deg) scale(${mix(0.4, 1, flip) * (1 - 0.3 * leave)})`,
      }}
    />
  );
}

function StockToast({ time }: { time: number }) {
  if (time < BEAT.toast) return null;

  return (
    <div className="social-card fin-toast" style={popIn(time, BEAT.toast, 0.55, 0.6)}>
      <span className="fin-toast-head">✓ {tr('sales.balanceUpdated')}</span>
      {STOCK_CHANGES.map((change, index) => (
        <span key={change.name} className="fin-toast-row" style={popIn(time, BEAT.toast + 0.08 + index * 0.12, 0.45, 0.5)}>
          <img src={change.icon} alt="" />
          <span className="fin-toast-text">
            <strong>{change.name}</strong>
            <span className={change.income ? 'fin-toast-amount' : 'fin-toast-amount is-cost'}>{change.amount}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

export function FinanceVisual({ time }: { time: number }) {
  const rise = enter(time, BEAT.card, 0.75, easeOut);
  const toSales = enter(time, BEAT.toSales, SWITCH_TIME, easeInOut);

  return (
    <div className="social-visual">
      <div
        className="social-card fin-card"
        style={{
          opacity: Math.min(1, rise * 1.4),
          transform: `translateY(${mix(120, 0, rise)}px) rotate(${mix(-4, 0, rise)}deg)`,
        }}
      >
        <div className="fin-tabs">
          <span className="fin-tab-pill" style={{ transform: `translateX(${100 * toSales}%)` }} />
          {TABS.map((tab, index) => {
            const on = index === 0 ? 1 - toSales : toSales;
            return (
              <span key={tab.label} className="fin-tab" style={{ ['--fin-on' as string]: `${Math.round(on * 100)}%` }}>
                <img src={tab.icon} alt="" />
                {tr(tab.label)}
              </span>
            );
          })}
        </div>
        <div className="fin-faces">
          <div className="fin-track" style={{ transform: `translateX(${-50 * toSales}%)` }}>
            <PurchasesFace time={time} />
            <SalesFace time={time} />
          </div>
        </div>
      </div>
      <Sticker time={time} />
      <StockToast time={time} />
    </div>
  );
}
