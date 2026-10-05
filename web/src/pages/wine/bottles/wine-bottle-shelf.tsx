import { round2 } from '@/config/wine';
import { BOTTLE_TYPE_INFO, type BottleType } from '@/config/wine-bottles';
import { useLanguage } from '@/contexts/language-context';
import type { BottleLot } from '@/pages/wine/wine-bottle-lots';

const SHOWN = 60;

type Props = {
  type: BottleType;
  lots: BottleLot[];
  nameFor: (lot: BottleLot) => string;
};

export function WineBottleShelf({ type, lots, nameFor }: Props) {
  const { t } = useLanguage();
  const info = BOTTLE_TYPE_INFO[type];
  const count = lots.reduce((sum, lot) => sum + lot.left, 0);
  const liters = round2(lots.reduce((sum, lot) => sum + lot.left * lot.size, 0));

  const bottles: { key: string; title: string }[] = [];
  for (const lot of lots) {
    for (let index = 0; index < lot.left && bottles.length < SHOWN; index += 1) {
      bottles.push({ key: `${lot.bottlingId}:${index}`, title: nameFor(lot) });
    }
  }

  return (
    <section className={`wine-shelf is-${type}`}>
      <div className="wine-shelf-head">
        <h2 className="wine-shelf-title">
          {t(info.labelKey)} <span>({info.range} {t('wine.unitLiter')})</span>
        </h2>
        <span className="wine-shelf-figures">
          <strong>{count}</strong> {t('wine.unitBottle')} · {liters} {t('wine.unitLiter')}
        </span>
      </div>
      {count === 0 ? (
        <p className="wine-shelf-empty">{t('wine.bottlesNoneOfType')}</p>
      ) : (
        <div className="wine-shelf-row">
          {bottles.map((bottle) => (
            <img key={bottle.key} src={info.icon} alt="" title={bottle.title} />
          ))}
          {count > bottles.length && <span className="wine-shelf-more">+{count - bottles.length}</span>}
        </div>
      )}
    </section>
  );
}
