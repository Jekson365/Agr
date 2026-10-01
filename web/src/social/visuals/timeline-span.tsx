import type { CSSProperties } from 'react';

import { ActivityIcon } from '@/components/icons/activity-icons';
import { toIsoDate } from '@/components/ui/date-utils';
import { HARVEST_STATUS_COLOR } from '@/config/harvest-status';
import type { PlacedSpan } from '@/pages/harvest/timeline/harvest-timeline-spans';
import { TIMELINE_DAYS, TIMELINE_ICONS, TIMELINE_MARKS } from '@/social/visuals/timeline-sample';
import '@/pages/harvest/timeline/harvest-timeline-span.css';

function SpanDays({ span }: { span: PlacedSpan }) {
  return (
    <span className="hcal-span-days">
      {TIMELINE_DAYS.slice(span.startIndex, span.endIndex + 1).map((day) => {
        const date = toIsoDate(day);
        const items = TIMELINE_MARKS.get(`${span.key}|${date}`) ?? [];
        return (
          <span key={date} className={items.length > 0 ? 'hcal-span-day marked' : 'hcal-span-day'}>
            {items.length > 0 && (
              <span className="hcal-span-day-mark">
                {items.map((activity) => (
                  <ActivityIcon key={activity} activity={activity} width={26} height={26} />
                ))}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

export function TimelineSpan({ span }: { span: PlacedSpan }) {
  const icons = TIMELINE_ICONS.get(span.key) ?? [];
  const className = `hcal-span${span.continuesBefore ? ' open-start' : ''}${span.continuesAfter ? ' open-end' : ''}`;

  return (
    <div
      className={className}
      style={
        {
          gridColumn: `${span.startIndex + 1} / ${span.endIndex + 2}`,
          gridRow: span.lane + 1,
          '--span-color': HARVEST_STATUS_COLOR[span.status],
        } as CSSProperties
      }
    >
      <SpanDays span={span} />

      <span className="hcal-span-head">
        <span className="hcal-span-title">{span.title}</span>
        <span className="hcal-span-dot" style={{ background: HARVEST_STATUS_COLOR[span.status] }} />
      </span>

      {icons.length > 0 && (
        <span className="hcal-span-icons">
          {icons.map((icon) => (
            <img key={icon} src={icon} alt="" />
          ))}
        </span>
      )}
    </div>
  );
}
