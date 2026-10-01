import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { copy, tr } from '@/promo/locale';
import { easeOut, enter, fadeUp, wave } from '@/promo/motion';
import { NEWEST_FIRST } from '@/promo/reports/rpt-sample';

const GOODS = NEWEST_FIRST.map((harvest) => ({ type: harvest.type, amount: harvest.kg, fresh: harvest.fresh === true }));

export function RptBalancePage({ time, since }: { time: number; since: number }) {
  const count = enter(time, since + 0.45, 1.1, easeOut);
  const glow = time > since + 0.45 ? 0.55 + wave(time, 1.2, 0.45) : 0;

  return (
    <div className="rpt-page" style={fadeUp(time, since, 18, 0.35)}>
      <div className="page-header">
        <h1 className="page-title">{tr('farm.balance')}</h1>
        <div className="balance-header-actions">
          <button type="button" className="add-button">
            + {tr('balance.adjust')}
          </button>
        </div>
      </div>
      <div className="balance-panel">
        <section className="balance-cards">
          {GOODS.map((good) => (
            <article
              key={good.type}
              className={good.fresh ? 'balance-card rpt-fresh' : 'balance-card'}
              style={good.fresh ? { boxShadow: `0 0 0 ${3 * glow}px var(--color-green), 0 18px 40px var(--color-shadow)` } : undefined}
            >
              <div className="balance-card-head">
                <span className="balance-card-icon">
                  <img src={stockKindImage(good.type)} alt="" />
                </span>
                <span className="balance-card-text">
                  <span className="balance-card-title">{stockTypeLabel(good.type, tr)}</span>
                </span>
              </div>
              <div className="balance-card-figure">
                <span className="balance-card-label">{tr('balance.colBalance')}</span>
                <span className="balance-card-value">
                  {good.fresh ? Math.round(good.amount * count) : good.amount}
                  <span className="balance-unit">{copy.farm.unitKg}</span>
                </span>
              </div>
              <div className="balance-card-row">
                <span className="balance-card-label">{tr('balance.colOnMarket')}</span>
                <span className="balance-card-none">—</span>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
