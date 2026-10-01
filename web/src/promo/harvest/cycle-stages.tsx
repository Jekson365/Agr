import { formatIsoDayNumeric } from '@/components/ui/date-utils';
import { HARVEST_STATUS_LABEL_KEY, HARVEST_STATUSES } from '@/config/harvest-status';
import { tr } from '@/promo/locale';
import { backOut, enter, mix } from '@/promo/motion';

type Props = {
  time: number;
  current: number;
  since: number;
  dates: string[];
  blockedFrom: number;
};

function stageState(index: number, current: number, blockedFrom: number): string {
  if (index < current) return 'done';
  if (index === current) return 'active';
  return index >= blockedFrom ? 'ahead blocked' : 'ahead';
}

export function CycleStages({ time, current, since, dates, blockedFrom }: Props) {
  const pulse = enter(time, since, 0.5, backOut);

  return (
    <>
      <div className="hd-stages-head">
        <h2 className="hd-block-title">{tr('harvest.statusLabel')}</h2>
        <button type="button" className="hd-stages-edit">
          {tr('harvest.stageDatesEdit')}
        </button>
      </div>

      <div className="hd-stages">
        {HARVEST_STATUSES.map((status, index) => {
          const reached = index <= current;
          return (
            <button
              key={status}
              type="button"
              className={`hd-stage ${stageState(index, current, blockedFrom)}`}
              style={index === current ? { transform: `scale(${mix(0.84, 1, pulse)})` } : undefined}
            >
              <span className="hd-stage-mark">{reached ? '✓' : index + 1}</span>
              <span className="hd-stage-text">
                <span>{tr(HARVEST_STATUS_LABEL_KEY[status])}</span>
                {reached && dates[index] && <span className="hd-stage-date">{formatIsoDayNumeric(dates[index])}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
