import { PREVIEW_LIVESTOCK } from '@/config/landing';
import ka from '@/locales/ka.json';
import { formatCount, tr } from '@/promo/figures';
import '@/social/visuals/cards.css';
import '@/social/visuals/business-cards.css';

const MAX_HEAD = Math.max(...PREVIEW_LIVESTOCK.map((group) => group.count));
const TOTAL = PREVIEW_LIVESTOCK.reduce((sum, group) => sum + group.count, 0);

export function LivestockCard() {
  return (
    <div className="social-card livestock-card">
      <div className="social-card-head">
        <span className="social-card-title">{ka.landing.preview.livestockTitle}</span>
        <span className="social-chip">
          {formatCount(TOTAL)} {ka.landing.preview.unitHead}
        </span>
      </div>
      {PREVIEW_LIVESTOCK.map((group) => (
        <div key={group.id} className="livestock-row">
          <span className="social-icon-tile">
            <img src={group.icon} alt="" />
          </span>
          <span className="livestock-name">{tr(group.nameKey)}</span>
          <span className="social-bar-track livestock-track">
            <span style={{ width: `${(group.count / MAX_HEAD) * 100}%` }} />
          </span>
          <strong className="livestock-count">
            {group.count} {ka.landing.preview.unitHead}
          </strong>
        </div>
      ))}
    </div>
  );
}
