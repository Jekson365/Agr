import chickenIcon from '@/assets/animals/chicken.png';
import sheepIcon from '@/assets/animals/sheep.png';
import milkIcon from '@/assets/goods/milk.png';
import { PREVIEW_LIVESTOCK } from '@/config/landing';
import { formatCount } from '@/promo/figures';
import { copy, tr } from '@/promo/locale';
import { enter, fadeUp, popIn, slideIn } from '@/promo/motion';
import { useClock } from '@/promo/use-clock';
import '@/promo/screens/livestock.css';

const PRODUCTION = [
  { icon: milkIcon, label: copy.production.typeMilk, value: 1240, unit: copy.farm.unitLiter },
  { icon: chickenIcon, label: copy.production.typeEgg, value: 3600, unit: '' },
  { icon: sheepIcon, label: copy.production.typeWool, value: 180, unit: copy.farm.unitKg },
];

const MAX_HEAD = Math.max(...PREVIEW_LIVESTOCK.map((group) => group.count));

export function LivestockScreen({ start }: { start: number }) {
  const time = useClock();
  const base = start + 0.12;

  return (
    <>
      <h3 className="promo-screen-title" style={fadeUp(time, base, 16)}>
        {copy.farm.livestock}
      </h3>

      <div className="promo-card promo-herd" style={fadeUp(time, base + 0.04, 24)}>
        <div className="promo-card-head">
          <span className="promo-card-title">{copy.landing.preview.livestockTitle}</span>
        </div>
        {PREVIEW_LIVESTOCK.map((group, index) => {
          const at = base + 0.1 + index * 0.06;
          const grow = enter(time, at + 0.08, 0.6);
          return (
            <div key={group.id} className="promo-herd-row" style={slideIn(time, at, 60, 0.45)}>
              <span className="promo-row-icon">
                <img src={group.icon} alt="" />
              </span>
              <span className="promo-herd-name">{tr(group.nameKey)}</span>
              <span className="promo-herd-track">
                <span style={{ width: `${(group.count / MAX_HEAD) * 100 * grow}%` }} />
              </span>
              <strong className="promo-herd-count">
                {formatCount(group.count * grow)} {copy.landing.preview.unitHead}
              </strong>
            </div>
          );
        })}
      </div>

      <div className="promo-card promo-yield" style={fadeUp(time, base + 0.3, 24)}>
        <div className="promo-card-head">
          <span className="promo-card-title">{copy.production.title}</span>
        </div>
        <div className="promo-yield-row">
          {PRODUCTION.map((item, index) => {
            const at = base + 0.36 + index * 0.06;
            return (
              <div key={item.label} className="promo-yield-item" style={popIn(time, at, 0.5, 0.6)}>
                <img src={item.icon} alt="" />
                <span className="promo-yield-label">{item.label}</span>
                <strong className="promo-yield-value">
                  {formatCount(item.value * enter(time, at + 0.08, 0.55))}
                  {item.unit ? ` ${item.unit}` : ''}
                </strong>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
