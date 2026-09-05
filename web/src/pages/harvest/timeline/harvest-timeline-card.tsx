import { DateField } from '@/components/ui/date-field';
import { countsInBalance } from '@/config/harvest-analysis';
import {
  GREENHOUSE_HARVEST_STATUSES,
  HARVEST_STATUS_COLOR,
  HARVEST_STATUS_LABEL_KEY,
  harvestStatusesFor,
} from '@/config/harvest-status';
import { useLanguage } from '@/contexts/language-context';
import type { SeedRow } from './harvest-timeline-seeds';
import type { HarvestPatch } from './use-timeline-data';
import type { TimelineHarvest } from './harvest-timeline-spans';
import './harvest-timeline-card.css';

const CARD_WIDTH = 300;
const CARD_HEIGHT = 330;

type Props = {
  harvest: TimelineHarvest;
  anchor: DOMRect;
  seeds: SeedRow[];
  saving: boolean;
  onPatch: (patch: HarvestPatch) => void;
  onEnter: () => void;
  onLeave: () => void;
};

export function HarvestTimelineCard({
  harvest,
  anchor,
  seeds,
  saving,
  onPatch,
  onEnter,
  onLeave,
}: Props) {
  const { t } = useLanguage();

  // A greenhouse books its yield at Harvested, so it is never offered the step past it — moving
  // one there would take it off the status its own balances key on.
  const stages =
    harvest.source === 'greenhouse'
      ? GREENHOUSE_HARVEST_STATUSES
      : harvestStatusesFor(harvest.source === 'fruit' ? 'Fruit' : 'Crop', harvest.status);
  const settled = countsInBalance(harvest.status);

  const spaceRight = window.innerWidth - anchor.right;
  const left =
    spaceRight > CARD_WIDTH + 16 ? anchor.right + 10 : Math.max(8, anchor.left - CARD_WIDTH - 10);
  const top = Math.max(8, Math.min(anchor.top, window.innerHeight - CARD_HEIGHT - 8));

  return (
    <div
      className="hcal-card"
      style={{ left, top, width: CARD_WIDTH }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <h3 className="hcal-card-title">{harvest.title}</h3>

      <span className="hcal-card-label">{t('harvestTimeline.statusLabel')}</span>
      <div className="hcal-card-statuses">
        {stages.map((status) => {
          const selected = status === harvest.status;
          const label = t(HARVEST_STATUS_LABEL_KEY[status]);
          return (
            <button
              key={status}
              type="button"
              className={selected ? 'hcal-card-status active' : 'hcal-card-status'}
              style={{ background: HARVEST_STATUS_COLOR[status] }}
              title={label}
              aria-label={label}
              disabled={saving || selected || settled}
              onClick={() => onPatch({ status })}
            >
              {selected && <span className="hcal-card-status-name">{label}</span>}
            </button>
          );
        })}
      </div>

      <div className="hcal-card-dates">
        <label className="hcal-card-field">
          <span className="hcal-card-label">{t('harvestTimeline.startDate')}</span>
          <DateField
            value={harvest.start}
            clearable={false}
            disabled={saving || settled}
            onChange={(value) => value && onPatch({ date: value })}
          />
        </label>

        <label className="hcal-card-field">
          <span className="hcal-card-label">{t('harvestTimeline.endDate')}</span>
          <DateField
            value={harvest.end}
            disabled={saving || settled}
            onChange={(value) => onPatch({ expectedHarvestDate: value })}
          />
        </label>
      </div>

      {settled && <span className="hcal-card-label">{t('harvest.statusBlockedSettled')}</span>}

      <span className="hcal-card-label">{t('seed.title')}</span>
      {seeds.length === 0 ? (
        <p className="hcal-card-empty">{t('harvestTimeline.noSeeds')}</p>
      ) : (
        <ul className="hcal-card-seeds">
          {seeds.map((seed) => (
            <li key={seed.key} className="hcal-card-seed">
              <img src={seed.icon} alt="" />
              <span className="hcal-card-seed-name">{seed.label}</span>
              <span className="hcal-card-seed-amount">{seed.amount}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
