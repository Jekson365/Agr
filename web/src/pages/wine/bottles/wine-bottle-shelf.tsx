import { formatAge } from '@/config/age';
import { round2 } from '@/config/wine';
import { bottleIconFor, bottleTypeOf } from '@/config/wine-bottles';
import { useLanguage } from '@/contexts/language-context';
import type { BottleLot } from '@/pages/wine/wine-bottle-lots';

const SHOWN = 60;

type Props = {
  size: number;
  lots: BottleLot[];
  nameFor: (lot: BottleLot) => string;
};

export function WineBottleShelf({ size, lots, nameFor }: Props) {
  const { t } = useLanguage();
  const icon = bottleIconFor(size);
  const count = lots.reduce((sum, lot) => sum + lot.left, 0);
  const liters = round2(lots.reduce((sum, lot) => sum + lot.left * lot.size, 0));

  const bottles: { key: string; title: string }[] = [];
  for (const lot of lots) {
    const age = formatAge(lot.date, t);
    const title = age ? `${nameFor(lot)} · ${t('wine.age')} ${age}` : nameFor(lot);
    for (let index = 0; index < lot.left && bottles.length < SHOWN; index += 1) {
      bottles.push({ key: `${lot.bottlingId}:${index}`, title });
    }
  }

  return (
    <section className={`wine-shelf is-${bottleTypeOf(size)}`}>
      <div className="wine-shelf-head">
        <h2 className="wine-shelf-title">{t('wine.bottleShelfTitle', { size })}</h2>
        <span className="wine-shelf-figures">
          <strong>{count}</strong> {t('wine.unitBottle')} · {liters} {t('wine.unitLiter')}
        </span>
      </div>
      <div className="wine-shelf-row">
        {bottles.map((bottle) => (
          <span key={bottle.key} className="wine-shelf-bottle" title={bottle.title}>
            <img src={icon} alt="" />
          </span>
        ))}
        {count > bottles.length && <span className="wine-shelf-more">+{count - bottles.length}</span>}
      </div>
    </section>
  );
}
