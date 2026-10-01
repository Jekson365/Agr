import { formatLocalizedIsoDay } from '@/components/ui/date-utils';
import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { copy, tr } from '@/promo/locale';
import { backOut, easeOut, enter, fadeUp, mix } from '@/promo/motion';
import { ChevronDown, FilterIcon, SearchIcon } from '@/promo/reports/rpt-icons';
import { BY_YIELD, MOVES_PER_GOOD } from '@/promo/reports/rpt-sample';

const UNIT = copy.farm.unitKg;
const PERIOD = `${formatLocalizedIsoDay('2026-01-01', 'ka')} – ${formatLocalizedIsoDay('2026-12-31', 'ka')}`;

const ROWS = BY_YIELD.map((harvest) => ({
  type: harvest.type,
  inflow: harvest.kg,
  moves: MOVES_PER_GOOD,
  fresh: harvest.fresh === true,
}));
const TOTAL_MOVES = ROWS.length * MOVES_PER_GOOD;

export function RptStockReport({ time, since }: { time: number; since: number }) {
  const count = enter(time, since + 0.55, 1, easeOut);
  const bump = enter(time, since + 0.55, 0.45, backOut);
  const landed = time >= since + 0.55;

  const cards = [
    { label: 'report.stockProducts', value: String(ROWS.length), tone: '' },
    { label: 'report.stockMovements', value: String(landed ? TOTAL_MOVES : TOTAL_MOVES - 1), tone: '', pop: true },
    { label: 'report.stockInMovements', value: String(landed ? TOTAL_MOVES : TOTAL_MOVES - 1), tone: 'green', pop: true },
    { label: 'report.stockOutMovements', value: '0', tone: 'red' },
  ];

  return (
    <div className="rpt-page" style={fadeUp(time, since, 18, 0.35)}>
      <span className="back-link">← {tr('report.title')}</span>
      <div className="page-header">
        <h1 className="page-title">{tr('report.stockPageTitle')}</h1>
        <button type="button" className="filter-toggle">
          <FilterIcon />
        </button>
      </div>
      <div className="search-row">
        <label className="search-field">
          <SearchIcon />
          <input placeholder={tr('report.searchPlaceholderStock')} readOnly />
        </label>
      </div>
      <div className="stock-summary-grid">
        {cards.map((card) => (
          <div key={card.label} className="stock-summary-card">
            <span className="stock-summary-label">{tr(card.label)}</span>
            <span
              className={card.tone ? `stock-summary-value ${card.tone}` : 'stock-summary-value'}
              style={card.pop ? { display: 'inline-block', transform: `scale(${mix(1.5, 1, bump)})` } : undefined}
            >
              {card.value}
            </span>
          </div>
        ))}
        <div className="stock-summary-card">
          <span className="stock-summary-label">{tr('productionBalance.period')}</span>
          <span className="stock-summary-value small">{PERIOD}</span>
        </div>
      </div>
      <div className="stock-rows">
        <div className="stock-row stock-row-head">
          <span>{tr('balance.colProduct')}</span>
          <span className="num">{tr('report.stockIn')}</span>
          <span className="num">{tr('report.stockOut')}</span>
          <span className="num">{tr('report.stockNet')}</span>
          <span className="num">{tr('report.stockMovements')}</span>
        </div>
        {ROWS.map((row) => {
          const amount = row.fresh ? (landed ? `+${Math.round(row.inflow * count)}` : '—') : `+${row.inflow}`;
          return (
            <div key={row.type} className={row.fresh ? 'stock-group rpt-fresh-row' : 'stock-group'}>
              <button type="button" className="stock-row stock-row-button">
                <span className="stock-cell product">
                  <span className="stock-chevron">
                    <ChevronDown />
                  </span>
                  <img src={stockKindImage(row.type)} alt="" />
                  <span className="stock-product-name">{stockTypeLabel(row.type, tr)}</span>
                  <span className="stock-kind-tag">{tr('balance.colPlant')}</span>
                </span>
                <span className="stock-cell num inflow">
                  {amount} <span className="stock-unit">{UNIT}</span>
                </span>
                <span className="stock-cell num outflow">
                  — <span className="stock-unit">{UNIT}</span>
                </span>
                <span className="stock-cell num net">
                  {amount} <span className="stock-unit">{UNIT}</span>
                </span>
                <span className="stock-cell num muted">{row.fresh && !landed ? row.moves - 1 : row.moves}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
