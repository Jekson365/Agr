import cabbageIcon from '@/assets/goods/cabbage.png';
import carrotIcon from '@/assets/goods/carrot.png';
import cornIcon from '@/assets/goods/corn.png';
import cucumberIcon from '@/assets/goods/cucumber.png';
import potatoIcon from '@/assets/goods/potato.png';
import tomatoIcon from '@/assets/goods/tomato.png';
import ka from '@/locales/ka.json';
import { formatCount } from '@/promo/figures';
import '@/social/visuals/cards.css';
import '@/social/visuals/field-cards.css';

const CROPS = [
  { icon: tomatoIcon, name: ka.farm.stockTomato, amount: 1340 },
  { icon: cucumberIcon, name: ka.farm.stockCucumber, amount: 742 },
  { icon: cabbageIcon, name: ka.farm.stockCabbage, amount: 455 },
  { icon: potatoIcon, name: ka.farm.stockPotato, amount: 2100 },
  { icon: carrotIcon, name: ka.farm.stockCarrot, amount: 380 },
  { icon: cornIcon, name: ka.farm.stockCorn, amount: 960 },
];

const TOTAL = CROPS.reduce((sum, crop) => sum + crop.amount, 0);

export function CropsCard() {
  return (
    <div className="social-card crops-card">
      <div className="social-card-head">
        <span className="social-card-title">{ka.farm.balance}</span>
        <span className="social-chip">
          {formatCount(TOTAL)} {ka.farm.unitKg}
        </span>
      </div>
      <div className="crops-grid">
        {CROPS.map((crop) => (
          <div key={crop.name} className="crops-tile">
            <img src={crop.icon} alt="" />
            <strong>{crop.name}</strong>
            <span>
              {formatCount(crop.amount)} {ka.farm.unitKg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
