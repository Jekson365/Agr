import appleIcon from '@/assets/trees/apple.png';
import cherryIcon from '@/assets/trees/cherry.png';
import peachIcon from '@/assets/trees/peach.png';
import pearIcon from '@/assets/trees/pear.png';
import treesIcon from '@/assets/icons/trees.png';
import { copy } from '@/promo/locale';
import '@/social/visuals/cards.css';
import '@/social/visuals/orchard-card.css';

const ROWS = [
  { icon: appleIcon, name: copy.farm.fruitApple, picked: [2] },
  { icon: peachIcon, name: copy.farm.fruitPeach, picked: [] },
  { icon: pearIcon, name: copy.farm.fruitPear, picked: [4] },
  { icon: cherryIcon, name: copy.farm.fruitCherry, picked: [] },
];

const TREES_PER_ROW = 6;

const CARE = [
  { label: copy.treatment.typeSpraying, color: 'var(--color-blue)' },
  { label: copy.treatment.typePruning, color: 'var(--color-violet)' },
  { label: copy.treatment.typeFertilization, color: 'var(--color-amber)' },
  { label: copy.treatment.typeIrrigation, color: 'var(--color-stage-fruit)' },
];

export function OrchardCard() {
  return (
    <div className="social-card orchard-card">
      <div className="social-card-head">
        <span className="social-card-title">{copy.fruits.trees}</span>
        <span className="social-chip">
          {ROWS.length * TREES_PER_ROW} {copy.farm.unitPlant}
        </span>
      </div>

      <div className="orchard-plan">
        {ROWS.map((row) => (
          <div key={row.name} className="orchard-row">
            <span className="orchard-row-name">{row.name}</span>
            <span className="orchard-row-trees">
              {Array.from({ length: TREES_PER_ROW }, (_, index) => (
                <span key={index} className={row.picked.includes(index) ? 'orchard-tree is-picked' : 'orchard-tree'}>
                  <img src={treesIcon} alt="" />
                  <img className="orchard-fruit" src={row.icon} alt="" />
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>

      <div className="orchard-care">
        {CARE.map((item) => (
          <span key={item.label} className="orchard-care-chip">
            <i style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
