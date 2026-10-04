import tomatoIcon from '@/assets/goods/tomato.png';
import { formatCount } from '@/promo/figures';
import { copy, LANGUAGE } from '@/promo/locale';
import { EN_COMPARE } from '@/social/copy/en';
import { KA_COMPARE } from '@/social/copy/ka';
import '@/social/visuals/cards.css';
import '@/social/visuals/compare-card.css';

const LABELS = LANGUAGE === 'en' ? EN_COMPARE : KA_COMPARE;

const BAR_MAX = 92;

const YIELD = { previous: 1050, current: 1340 };

const COLUMNS = [
  { id: 'previous', label: LABELS.previous, value: YIELD.previous },
  { id: 'current', label: LABELS.current, value: YIELD.current },
];

const METRICS = [
  { label: copy.report.colRevenue, previous: 4200, current: 5600 },
  { label: LABELS.profit, previous: 1300, current: 2505 },
];

const change = (previous: number, current: number) => Math.round(((current - previous) / previous) * 100);

const signed = (value: number) => `${value > 0 ? '+' : ''}${value}%`;

function Money({ value }: { value: number }) {
  return (
    <>
      <span className="compare-lari">₾</span>
      {formatCount(value)}
    </>
  );
}

function TrendArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </svg>
  );
}

export function CompareCard() {
  return (
    <div className="social-card compare-card">
      <div className="compare-head">
        <span className="social-icon-tile">
          <img src={tomatoIcon} alt="" />
        </span>
        <span className="compare-heading">
          <strong>{copy.landing.harvest.sampleTomato}</strong>
          <span>{copy.report.yieldLabel}</span>
        </span>
      </div>

      <div className="compare-plot">
        <div className="compare-chart">
          {COLUMNS.map((column) => (
            <span key={column.id} className={`compare-slot is-${column.id}`}>
              <b>
                {formatCount(column.value)} {copy.farm.unitKg}
              </b>
              <span className="compare-bar" style={{ height: (column.value / YIELD.current) * BAR_MAX }} />
            </span>
          ))}
          {COLUMNS.map((column) => (
            <span key={column.id} className={`compare-caption is-${column.id}`}>
              {column.label}
            </span>
          ))}
        </div>

        <div className="compare-hero">
          <span className="compare-hero-figure">
            <TrendArrow />
            {signed(change(YIELD.previous, YIELD.current))}
          </span>
          <span className="compare-hero-note">{LABELS.versus}</span>
        </div>
      </div>

      <div className="compare-tiles">
        {METRICS.map((metric) => (
          <div key={metric.label} className="compare-tile">
            <span className="compare-tile-label">{metric.label}</span>
            <span className="compare-tile-main">
              <strong>
                <Money value={metric.current} />
              </strong>
              <span className="social-chip">
                <TrendArrow />
                {signed(change(metric.previous, metric.current))}
              </span>
            </span>
            <span className="compare-tile-before">
              {LABELS.before}: <Money value={metric.previous} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
