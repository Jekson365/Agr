import { PREVIEW_GREENHOUSE } from '@/config/landing';
import { copy } from '@/promo/locale';
import '@/social/visuals/cards.css';
import '@/social/visuals/field-cards.css';
import '@/social/visuals/greenhouse-card.css';

const TINTS = ['var(--color-danger)', 'var(--color-green)', 'var(--color-stage-emergence)'];
const COLUMNS = [4, 3, 2];
const ROWS_PER_BED = 3;

export function GreenhouseCard() {
  const total = PREVIEW_GREENHOUSE.reduce((sum, bed) => sum + bed.sqm, 0);

  return (
    <div className="social-card greenhouse-card">
      <div className="social-card-head">
        <span className="social-card-title">{copy.landing.preview.greenhouseTitle}</span>
        <span className="social-chip is-blue">
          {total} {copy.landing.preview.unitSqm}
        </span>
      </div>

      <div className="greenhouse-plan">
        {PREVIEW_GREENHOUSE.map((bed, index) => (
          <div
            key={bed.id}
            className="greenhouse-bed"
            style={{
              flexGrow: bed.sqm,
              borderColor: TINTS[index],
              background: `color-mix(in srgb, ${TINTS[index]} 11%, var(--color-surface))`,
            }}
          >
            <span className="greenhouse-bed-head" style={{ color: TINTS[index] }}>
              {copy.landing.preview.section} {bed.section}
            </span>
            <span className="greenhouse-bed-plants" style={{ gridTemplateColumns: `repeat(${COLUMNS[index]}, 1fr)` }}>
              {Array.from({ length: COLUMNS[index] * ROWS_PER_BED }, (_, plant) => (
                <img key={plant} src={bed.icon} alt="" />
              ))}
            </span>
            <strong className="greenhouse-bed-area">
              {bed.sqm} {copy.landing.preview.unitSqm}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}
