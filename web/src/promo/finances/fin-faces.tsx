import type { CSSProperties } from 'react';

import { tr } from '@/promo/locale';
import { backOut, easeOut, enter, mix } from '@/promo/motion';
import { NEW_PURCHASE, NEW_SALE, PURCHASE_ROWS, SALE_MONTHS, type PurchaseRow } from '@/promo/finances/fin-sample';
import { formatGel } from '@/promo/finances/fin-text';
import { BEAT } from '@/promo/finances/fin-timeline';

const ROW_HEIGHT = 84;
const PURCHASES_BEFORE = PURCHASE_ROWS.reduce((sum, row) => sum + row.total, 0);
const SALES_BEFORE = SALE_MONTHS.slice(0, -1).reduce((sum, month) => sum + month.total, 0);
const SALES_MAX = Math.max(...SALE_MONTHS.map((month) => month.total));

function Icons({ icons }: { icons: string[] }) {
  return (
    <span className="fin-icons">
      {icons.map((icon, index) => (
        <img key={index} src={icon} alt="" />
      ))}
    </span>
  );
}

function Row({ row, fresh, style }: { row: PurchaseRow; fresh?: number; style?: CSSProperties }) {
  return (
    <div className="fin-row" style={{ ...style, ['--fin-fresh' as string]: `${Math.round(100 * (fresh ?? 0))}%` }}>
      <Icons icons={row.icons} />
      <span className="fin-row-text">
        <strong>{row.seller}</strong>
        <span>{tr('purchase.itemCount').replace('{count}', String(row.icons.length))}</span>
      </span>
      <span className="fin-row-amount">{formatGel(row.total)}</span>
    </div>
  );
}

export function PurchasesFace({ time }: { time: number }) {
  const listed = enter(time, BEAT.rows, 1.1, easeOut);
  const added = enter(time, BEAT.newPurchase, 0.55, easeOut);
  const counted = enter(time, BEAT.newPurchase + 0.1, 0.9, easeOut);
  const glow = time < BEAT.newPurchase ? 0 : 1 - enter(time, BEAT.newPurchase + 1.3, 1.2);
  const shown = time >= BEAT.newPurchase;

  return (
    <div className="fin-face">
      <div className="fin-face-head">
        <span>{tr('purchase.statTotal')}</span>
        <strong className="fin-total is-cost">{formatGel(PURCHASES_BEFORE * listed + NEW_PURCHASE.total * counted)}</strong>
      </div>
      <div className="fin-rows">
        {shown && <Row row={NEW_PURCHASE} fresh={glow} style={{ opacity: added, transform: `translateX(${mix(-60, 0, added)}px)` }} />}
        {PURCHASE_ROWS.map((row, index) => {
          const enterRow = enter(time, BEAT.rows + index * 0.12, 0.45, easeOut);
          return (
            <Row
              key={row.key}
              row={row}
              style={{
                opacity: enterRow,
                transform: `translateY(${mix(26, 0, enterRow) + (shown ? mix(-ROW_HEIGHT, 0, added) : 0)}px)`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function SalesFace({ time }: { time: number }) {
  const sold = enter(time, BEAT.newSale, 0.8, easeOut);
  const pop = enter(time, BEAT.newSale + 0.35, 0.5, backOut);
  const total = SALES_BEFORE * enter(time, BEAT.bars, 1, easeOut) + NEW_SALE.amount * sold;

  return (
    <div className="fin-face">
      <div className="fin-face-head">
        <span>{tr('sales.chartTitle')}</span>
        <strong className="fin-total">{formatGel(total)}</strong>
      </div>
      <div className="fin-bars">
        {SALE_MONTHS.map((month, index) => {
          const last = index === SALE_MONTHS.length - 1;
          const grow = last ? sold : enter(time, BEAT.bars + index * 0.09, 0.6, easeOut);
          return (
            <span key={month.label} className={last ? 'fin-bar-col is-new' : 'fin-bar-col'}>
              <span className="fin-bar-slot">
                <span className="fin-bar" style={{ height: `${(month.total / SALES_MAX) * 100 * grow}%` }} />
              </span>
              <small>{month.label}</small>
            </span>
          );
        })}
      </div>
      <div className="fin-row is-sale" style={{ opacity: sold, transform: `translateY(${mix(24, 0, sold)}px)` }}>
        <Icons icons={[NEW_SALE.icon]} />
        <span className="fin-row-text">
          <strong>{NEW_SALE.item}</strong>
          <span>
            {NEW_SALE.quantity} · {NEW_SALE.buyer}
          </span>
        </span>
        <span className="social-chip" style={{ transform: `scale(${mix(0.4, 1, pop)})`, opacity: Math.min(1, pop * 1.5) }}>
          {tr('sales.statusSold')}
        </span>
        <span className="fin-row-amount is-income">+{formatGel(NEW_SALE.amount)}</span>
      </div>
    </div>
  );
}
