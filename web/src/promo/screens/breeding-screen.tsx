import cowIcon from '@/assets/animals/cow.png';
import { copy } from '@/promo/locale';
import { backOut, enter, fadeUp, mix, popIn, slideIn } from '@/promo/motion';
import { useClock } from '@/promo/use-clock';
import type { BreedingStatus } from '@/types/breeding-event';
import '@/promo/screens/breeding.css';

const STAGES: BreedingStatus[] = ['Breeding', 'PregnancyConfirmed', 'Completed'];

const STAGE_LABEL: Record<BreedingStatus, string> = {
  Breeding: copy.breedingEvent.statusBreeding,
  PregnancyConfirmed: copy.breedingEvent.statusPregnancyConfirmed,
  Completed: copy.breedingEvent.statusCompleted,
  Failed: copy.breedingEvent.statusFailed,
};

const STAGE_TONE: Record<BreedingStatus, string> = {
  Breeding: 'is-blue',
  PregnancyConfirmed: 'is-amber',
  Completed: 'is-green',
  Failed: 'is-red',
};

const PAIRS: { male: string; female: string; status: BreedingStatus; offspring?: number }[] = [
  { male: 'C-4', female: 'C-12', status: 'Completed', offspring: 1 },
  { male: 'C-7', female: 'C-15', status: 'PregnancyConfirmed' },
  { male: 'C-4', female: 'C-18', status: 'Breeding' },
];

function Parent({ code, label }: { code: string; label: string }) {
  return (
    <span className="promo-parent">
      <img src={cowIcon} alt="" />
      <span>
        <strong>{code}</strong>
        <small>{label}</small>
      </span>
    </span>
  );
}

export function BreedingScreen({ start }: { start: number }) {
  const time = useClock();
  const base = start + 0.14;

  return (
    <>
      <h3 className="promo-screen-title" style={fadeUp(time, base, 16)}>
        {copy.breedingEvent.title}
      </h3>

      <div className="promo-card promo-breeding" style={fadeUp(time, base + 0.04, 24)}>
        <div className="promo-breeding-head">
          <span className="promo-row-icon">
            <img src={cowIcon} alt="" />
          </span>
          <strong>{copy.farm.cow}</strong>
          <span className="promo-breeding-add" style={popIn(time, base + 0.2, 0.4, 0.6)}>
            + {copy.breedingEvent.add}
          </span>
        </div>

        {PAIRS.map((pair, index) => {
          const at = base + 0.22 + index * 0.1;
          const reached = STAGES.indexOf(pair.status);
          const born = pair.offspring ? enter(time, at + 0.62, 0.5, backOut) : 0;
          return (
            <div key={`${pair.male}-${pair.female}`} className="promo-pair" style={slideIn(time, at, 60, 0.45)}>
              <div className="promo-pair-top">
                <Parent code={pair.male} label={copy.breedingEvent.male} />
                <span className="promo-pair-join">×</span>
                <Parent code={pair.female} label={copy.breedingEvent.female} />
                <span className={`promo-stage-badge ${STAGE_TONE[pair.status]}`} style={popIn(time, at + 0.5, 0.4, 0.5)}>
                  {STAGE_LABEL[pair.status]}
                </span>
              </div>
              <div className="promo-pair-stages">
                {STAGES.map((stage, step) => {
                  const fill = step <= reached ? enter(time, at + 0.16 + step * 0.12, 0.3) : 0;
                  return (
                    <span
                      key={stage}
                      className={`promo-stage-step ${STAGE_TONE[stage]}`}
                      style={{ opacity: mix(0.45, 1, fill), transform: `scale(${mix(0.94, 1, fill)})` }}
                    >
                      <i style={{ transform: `scale(${fill})` }} />
                      {STAGE_LABEL[stage]}
                    </span>
                  );
                })}
                {pair.offspring && (
                  <span className="promo-offspring" style={{ opacity: Math.min(1, born * 1.6), transform: `scale(${mix(0.4, 1, born)})` }}>
                    +{pair.offspring} {copy.breedingEvent.resultRecorded}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
