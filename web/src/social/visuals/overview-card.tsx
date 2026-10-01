import calendarIcon from '@/assets/icons/calendar.png';
import financesIcon from '@/assets/icons/finances.png';
import harvestIcon from '@/assets/icons/harvest.png';
import marketIcon from '@/assets/icons/market.png';
import reportIcon from '@/assets/icons/report.png';
import animalsIcon from '@/assets/properties/animals.png';
import fruitsIcon from '@/assets/properties/fruits.png';
import landIcon from '@/assets/properties/land.png';
import plantsIcon from '@/assets/properties/plants.png';
import { copy } from '@/promo/locale';
import '@/social/visuals/cards.css';
import '@/social/visuals/field-cards.css';
import '@/social/visuals/overview-card.css';

const AREAS = [
  { icon: plantsIcon, label: copy.dashboard.plantFarming },
  { icon: harvestIcon, label: copy.dashboard.harvest },
  { icon: fruitsIcon, label: copy.farm.fruits },
  { icon: animalsIcon, label: copy.farm.livestock },
  { icon: marketIcon, label: copy.market.title },
  { icon: financesIcon, label: copy.finances.title },
  { icon: reportIcon, label: copy.dashboard.report },
  { icon: landIcon, label: copy.map.title },
  { icon: calendarIcon, label: copy.dashboard.calendar },
];

export function OverviewCard() {
  return (
    <div className="social-card overview-card">
      <div className="crops-grid">
        {AREAS.map((area) => (
          <div key={area.label} className="crops-tile overview-tile">
            <img src={area.icon} alt="" />
            <strong>{area.label}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
