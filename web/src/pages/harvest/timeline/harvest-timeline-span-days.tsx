import { ActivityIcon } from '@/components/icons/activity-icons';
import { toIsoDate } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import type { PlacedSpan } from './harvest-timeline-spans';

type Props = {
  span: PlacedSpan;
  days: Date[];
  /** What every day of every span carries, keyed by span and date. */
  marks: Map<string, string[]>;
  /** Too many days in view for a box to hold its icons; it stays a plain mark. */
  compact: boolean;
  onMark: (date: string, at: { x: number; y: number }) => void;
  onHover: (items: string[], at: { x: number; y: number }) => void;
  onLeave: () => void;
};

/** The day boxes laid across one span: the field work each day of the harvest carries, and the
 *  right-click that changes it. */
export function HarvestTimelineSpanDays({ span, days, marks, compact, onMark, onHover, onLeave }: Props) {
  const { t } = useLanguage();

  return (
    <span className="hcal-span-days">
      {days.slice(span.startIndex, span.endIndex + 1).map((day) => {
        const date = toIsoDate(day);
        const items = marks.get(`${span.key}|${date}`) ?? [];
        const marked = items.length > 0;
        const boxClass = marked ? (compact ? 'hcal-span-day marked filled' : 'hcal-span-day marked') : 'hcal-span-day';
        return (
          <button
            key={date}
            type="button"
            className={boxClass}
            title={marked ? undefined : t('harvestTimeline.markHint')}
            onMouseEnter={(e) => {
              if (!marked) return;
              const box = e.currentTarget.getBoundingClientRect();
              onHover(items, { x: box.left + box.width / 2, y: box.bottom });
            }}
            onMouseLeave={onLeave}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMark(date, { x: e.clientX, y: e.clientY });
            }}
          >
            {!compact && marked && (
              <span className="hcal-span-day-mark">
                {items.map((activity, index) => (
                  <ActivityIcon key={`${activity}${index}`} activity={activity} width={26} height={26} />
                ))}
              </span>
            )}
          </button>
        );
      })}
    </span>
  );
}
