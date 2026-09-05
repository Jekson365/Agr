import { useState, type CSSProperties } from 'react';

import { ActivityIcon } from '@/components/icons/activity-icons';
import { monthNames, toIsoDate, weekdayShortNames } from '@/components/ui/date-utils';
import { harvestActivityLabel } from '@/config/harvest-activity';
import { DayForecast } from '@/components/weather/day-forecast';
import type { Forecast } from '@/components/weather/use-forecast';
import { HARVEST_STATUS_COLOR, HARVEST_STATUS_LABEL_KEY } from '@/config/harvest-status';
import { useLanguage } from '@/contexts/language-context';
import {
  layoutSpans,
  monthSegments,
  MONTHS_ONLY_FROM,
  type TimelineHarvest,
} from './harvest-timeline-spans';
import { HarvestTimelineSpanDays } from './harvest-timeline-span-days';
import './harvest-timeline-grid.css';
import './harvest-timeline-span.css';

const ROW_HEIGHT = 85;
const MIN_ROWS = 12;

type Props = {
  days: Date[];
  today: Date;
  harvests: TimelineHarvest[];
  emptyText: string;
  seedIcons: Map<string, string[]>;
  /** What each marked day carries — its absence is what makes a day unmarked. */
  dayActivities: Map<string, string[]>;
  forecast: Forecast;
  onPickDay: (day: Date) => void;
  /** A day of a harvest was right-clicked: where to open its menu, and which day it is. */
  onMarkDay: (harvest: TimelineHarvest, date: string, at: { x: number; y: number }) => void;
  onHover: (harvest: TimelineHarvest, anchor: DOMRect) => void;
  onLeave: () => void;
};

export function HarvestTimelineGrid({
  days,
  today,
  harvests,
  emptyText,
  seedIcons,
  dayActivities,
  forecast,
  onPickDay,
  onMarkDay,
  onHover,
  onLeave,
}: Props) {
  const { t, language } = useLanguage();
  // The marks are shown by hand rather than through a title: the hover card opening beside the
  // span cancels the browser's own tooltip before it ever appears.
  const [hoverMarks, setHoverMarks] = useState<{ items: string[]; x: number; y: number } | null>(null);
  const spans = layoutSpans(harvests, days);
  const template = `repeat(${days.length}, minmax(0, 1fr))`;
  const monthsOnly = days.length > MONTHS_ONLY_FROM;
  const compact = days.length > 21;
  const months = monthNames(language);
  const names = weekdayShortNames(language);
  const todayKey = toIsoDate(today);
  const cellWidth = `calc(100% / ${days.length})`;
  const todayIndex = days.findIndex((day) => toIsoDate(day) === todayKey);

  return (
    <div className="hcal-timeline">
      <div className="hcal-timeline-months" style={{ gridTemplateColumns: template }}>
        {monthSegments(days).map((segment) => (
          <span
            key={segment.key}
            className="hcal-timeline-month"
            style={{ gridColumn: `${segment.startIndex + 1} / ${segment.endIndex + 2}` }}
          >
            {`${months[segment.month]} ${segment.year}`}
          </span>
        ))}
      </div>

      {!monthsOnly && (
        <div className="hcal-timeline-days" style={{ gridTemplateColumns: template }}>
          {days.map((day) => {
            const key = toIsoDate(day);
            const forecastDay = forecast.get(key);
            return (
              <button
                key={key}
                type="button"
                className={`hcal-timeline-day${key === todayKey ? ' today' : ''}`}
                onClick={() => onPickDay(day)}
              >
                {!compact && <span className="hcal-timeline-weekday">{names[(day.getDay() + 6) % 7]}</span>}
                <span className="hcal-timeline-date">{day.getDate()}</span>
                {forecastDay && <DayForecast day={forecastDay} compact={compact} />}
              </button>
            );
          })}
        </div>
      )}

      <div
        className="hcal-timeline-body"
        style={{
          backgroundSize: `100% ${ROW_HEIGHT}px, ${cellWidth} 100%`,
          minHeight: Math.max(MIN_ROWS, harvests.length + 2) * ROW_HEIGHT,
        }}
      >
        <div
          className="hcal-timeline-rows"
          style={{ gridTemplateColumns: template, gridAutoRows: ROW_HEIGHT }}
        >
          {spans.map((span) => (
            <div
              key={span.key}
              className={`hcal-span${span.overdue ? ' overdue' : ''}${
                span.continuesBefore ? ' open-start' : ''
              }${span.continuesAfter ? ' open-end' : ''}`}
              style={
                {
                  gridColumn: `${span.startIndex + 1} / ${span.endIndex + 2}`,
                  gridRow: span.lane + 1,
                  '--span-color': HARVEST_STATUS_COLOR[span.status],
                } as CSSProperties
              }
              title={`${span.title} · ${t(HARVEST_STATUS_LABEL_KEY[span.status])}`}
              onMouseEnter={(e) => onHover(span, e.currentTarget.getBoundingClientRect())}
              onMouseLeave={onLeave}
              onFocus={(e) => onHover(span, e.currentTarget.getBoundingClientRect())}
              onBlur={onLeave}
            >
              <HarvestTimelineSpanDays
                span={span}
                days={days}
                marks={dayActivities}
                compact={compact}
                onMark={(date, at) => onMarkDay(span, date, at)}
                onHover={(items, at) => setHoverMarks({ items, ...at })}
                onLeave={() => setHoverMarks(null)}
              />

              <span className="hcal-span-head">
                <span className="hcal-span-title">{span.title}</span>
                <span className="hcal-span-dot" style={{ background: HARVEST_STATUS_COLOR[span.status] }} />
              </span>

              {(seedIcons.get(span.key) ?? []).length > 0 && (
                <span className="hcal-span-icons">
                  {(seedIcons.get(span.key) ?? []).map((icon) => (
                    <img key={icon} src={icon} alt="" />
                  ))}
                </span>
              )}
            </div>
          ))}
        </div>

        {todayIndex >= 0 && (
          <div className="hcal-timeline-today-layer" style={{ gridTemplateColumns: template }}>
            <span
              className="hcal-timeline-today"
              style={{ gridColumn: `${todayIndex + 1} / ${todayIndex + 2}` }}
            />
          </div>
        )}

        {spans.length === 0 && <p className="hcal-timeline-empty">{emptyText}</p>}
      </div>

      {hoverMarks && (
        <span className="hcal-day-note" style={{ left: hoverMarks.x, top: hoverMarks.y }}>
          {hoverMarks.items.map((activity, index) => (
            <span key={`${activity}${index}`} className="hcal-day-note-row">
              <ActivityIcon activity={activity} width={15} height={15} />
              <span>{harvestActivityLabel(activity, t)}</span>
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
