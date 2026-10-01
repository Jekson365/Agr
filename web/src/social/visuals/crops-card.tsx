import cabbageIcon from '@/assets/goods/cabbage.png';
import carrotIcon from '@/assets/goods/carrot.png';
import cornIcon from '@/assets/goods/corn.png';
import cucumberIcon from '@/assets/goods/cucumber.png';
import potatoIcon from '@/assets/goods/potato.png';
import tomatoIcon from '@/assets/goods/tomato.png';
import { formatCount } from '@/promo/figures';
import { copy } from '@/promo/locale';
import '@/social/visuals/cards.css';
import '@/social/visuals/field-cards.css';

const CROPS = [
  { icon: tomatoIcon, name: copy.farm.stockTomato, amount: 1340 },
  { icon: cucumberIcon, name: copy.farm.stockCucumber, amount: 742 },
  { icon: cabbageIcon, name: copy.farm.stockCabbage, amount: 455 },
  { icon: potatoIcon, name: copy.farm.stockPotato, amount: 2100 },
  { icon: carrotIcon, name: copy.farm.stockCarrot, amount: 380 },
  { icon: cornIcon, name: copy.farm.stockCorn, amount: 960 },
];

const TOTAL = CROPS.reduce((sum, crop) => sum + crop.amount, 0);

export function CropsCard() {
  return (
    <div className="social-card crops-card">
      <div className="social-card-head">
        <span className="social-card-title">{copy.farm.balance}</span>
        <span className="social-chip">
          {formatCount(TOTAL)} {copy.farm.unitKg}
        </span>
      </div>
      <div className="crops-grid">
        {CROPS.map((crop) => (
          <div key={crop.name} className="crops-tile">
            <img src={crop.icon} alt="" />
            <strong>{crop.name}</strong>
            <span>
              {formatCount(crop.amount)} {copy.farm.unitKg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
