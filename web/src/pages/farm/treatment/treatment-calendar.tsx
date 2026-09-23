import { useState, type CSSProperties } from 'react';

import { fruitKindImage, treeStockLabel } from '@/config/fruit-kinds';
import { treeTreatmentColour, treeTreatmentLabel } from '@/config/tree-treatment';
import { formatLocalizedDate, monthNames, toIsoDate, weekdayShortNames } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import { monthSegments } from '@/pages/harvest/timeline/harvest-timeline-spans';
import type { TreeStock } from '@/types/tree-stock';
import type { TreeTreatment } from '@/types/tree-treatment';
import { cellKey } from './use-treatments';
import './treatment-calendar.css';
import './treatment-note.css';

const LABEL_WIDTH = 168;
const MIN_DAY_WIDTH = 34;
const NOTE_HALF_WIDTH = 120;

type Props = {
  days: Date[];
  today: Date;
  orchards: TreeStock[];
  dayTreatments: Map<string, TreeTreatment[]>;
  emptyText: string;
  activeId: number | null;
  onPickDay: (orchardId: number, date: string, at: { x: number; y: number }) => void;
  onPickOrchard: (orchardId: number) => void;
};

export function TreatmentCalendar({
  days,
  today,
  orchards,
  dayTreatments,
  emptyText,
  activeId,
  onPickDay,
  onPickOrchard,
}: Props) {
  const { t, language } = useLanguage();

  const [hover, setHover] = useState<{ day: string; rows: TreeTreatment[]; x: number; y: number } | null>(null);

  const template = `${LABEL_WIDTH}px repeat(${days.length}, minmax(0, 1fr))`;
  const months = monthNames(language);
  const names = weekdayShortNames(language);
  const todayKey = toIsoDate(today);

  return (
    <div className="trt-cal" style={{ minWidth: LABEL_WIDTH + days.length * MIN_DAY_WIDTH }}>
      <div className="trt-cal-head" style={{ gridTemplateColumns: template }}>
        <span className="trt-cal-corner" />
        {monthSegments(days).map((segment) => (
          <span
            key={segment.key}
            className="trt-cal-month"
            style={{ gridColumn: `${segment.startIndex + 2} / ${segment.endIndex + 3}` }}
          >
            {`${months[segment.month]} ${segment.year}`}
          </span>
        ))}
      </div>

      <div className="trt-cal-head days" style={{ gridTemplateColumns: template }}>
        <span className="trt-cal-corner">{t('treatment.orchards')}</span>
        {days.map((day) => {
          const key = toIsoDate(day);
          return (
            <span key={key} className={key === todayKey ? 'trt-cal-day today' : 'trt-cal-day'}>
              <span className="trt-cal-weekday">{names[(day.getDay() + 6) % 7]}</span>
              <span className="trt-cal-date">{day.getDate()}</span>
            </span>
          );
        })}
      </div>

      {orchards.length === 0 ? (
        <p className="trt-cal-empty">{emptyText}</p>
      ) : (
        orchards.map((orchard) => (
          <div key={orchard.id} className="trt-cal-row" style={{ gridTemplateColumns: template }}>
            <button
              type="button"
              className={orchard.id === activeId ? 'trt-cal-label is-active' : 'trt-cal-label'}
              title={t('treatment.positionPick')}
              onClick={() => onPickOrchard(orchard.id)}
            >
              <img src={fruitKindImage(orchard.type)} alt="" className="trt-cal-label-icon" />
              <span className="trt-cal-label-name">{treeStockLabel(orchard, t)}</span>
            </button>

            {days.map((day) => {
              const date = toIsoDate(day);
              const rows = dayTreatments.get(cellKey(orchard.id, date)) ?? [];
              const open = (event: { clientX: number; clientY: number; preventDefault: () => void }) => {
                event.preventDefault();
                onPickDay(orchard.id, date, { x: event.clientX, y: event.clientY });
              };
              return (
                <button
                  key={date}
                  type="button"
                  className={date === todayKey ? 'trt-cell today' : 'trt-cell'}
                  title={rows.length === 0 ? t('treatment.assignHint') : undefined}
                  onClick={open}
                  onContextMenu={open}
                  onMouseEnter={(e) => {
                    if (rows.length === 0) return;
                    const box = e.currentTarget.getBoundingClientRect();
                    const centre = box.left + box.width / 2;
                    setHover({
                      day: formatLocalizedDate(day, language),
                      rows,
                      x: Math.min(Math.max(centre, NOTE_HALF_WIDTH + 8), window.innerWidth - NOTE_HALF_WIDTH - 8),
                      y: box.bottom,
                    });
                  }}
                  onMouseLeave={() => setHover(null)}
                >
                  {rows.map((row) => (
                    <span
                      key={row.id}
                      className="trt-chip"
                      style={{ '--chip': treeTreatmentColour(row.type) } as CSSProperties}
                    />
                  ))}
                </button>
              );
            })}
          </div>
        ))
      )}

      {hover && (
        <span key={`${hover.day}${hover.x}`} className="trt-note" style={{ left: hover.x, top: hover.y }}>
          <span className="trt-note-day">{hover.day}</span>
          {hover.rows.map((row) => (
            <span key={row.id} className="trt-note-row">
              <span
                className="trt-note-dot"
                style={{ background: treeTreatmentColour(row.type) }}
                aria-hidden="true"
              />
              <span>{treeTreatmentLabel(row.type, t)}</span>
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
