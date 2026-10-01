import { REPORT_SHARES } from '@/config/landing';
import { copy } from '@/promo/locale';
import '@/social/visuals/cards.css';
import '@/social/visuals/business-cards.css';

const SHARE_LABELS: Record<string, string> = {
  crop: copy.report.categoryCrop,
  fruit: copy.report.categoryFruit,
  livestock: copy.report.categoryLivestock,
};

const QUARTERS = [copy.report.quarterQ1, copy.report.quarterQ2, copy.report.quarterQ3, copy.report.quarterQ4].map(
  (label) => label.split(' · ')[0]
);

const REVENUE = [46, 62, 90, 72];
const COST = [30, 36, 44, 40];

function donutStops(): string {
  let cursor = 0;
  return REPORT_SHARES.map((slice) => {
    const from = cursor;
    cursor += slice.share;
    return `${slice.color} ${from}% ${cursor}%`;
  }).join(', ');
}

export function ReportsCard() {
  const leading = REPORT_SHARES[0];

  return (
    <div className="social-card reports-card">
      <div className="reports-top">
        <div className="reports-donut" style={{ background: `conic-gradient(${donutStops()})` }}>
          <span className="reports-donut-hole">
            <strong>{leading.share}%</strong>
            <span>{SHARE_LABELS[leading.id]}</span>
          </span>
        </div>
        <ul className="reports-legend">
          {REPORT_SHARES.map((slice) => (
            <li key={slice.id}>
              <i style={{ background: slice.color }} />
              <span>{SHARE_LABELS[slice.id]}</span>
              <strong>{slice.share}%</strong>
            </li>
          ))}
        </ul>
      </div>

      <div className="reports-quarters">
        <span className="social-legend">
          <span>
            <i />
            {copy.report.colRevenue}
          </span>
          <span>
            <i className="is-cost" />
            {copy.report.colCost}
          </span>
        </span>
        <div className="reports-bars">
          {QUARTERS.map((label, index) => (
            <span key={label} className="reports-quarter">
              <span className="reports-pair">
                <span style={{ height: `${REVENUE[index]}%` }} />
                <span className="is-cost" style={{ height: `${COST[index]}%` }} />
              </span>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
