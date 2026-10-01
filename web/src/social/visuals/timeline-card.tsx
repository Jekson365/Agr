import { monthNames, toIsoDate, weekdayShortNames } from '@/components/ui/date-utils';
import { WeatherIcon } from '@/components/weather/weather-icon';
import { weatherIconKind, weatherTone } from '@/config/weather';
import { layoutSpans, monthSegments } from '@/pages/harvest/timeline/harvest-timeline-spans';
import { LANGUAGE } from '@/promo/locale';
import {
  TIMELINE_DAYS,
  TIMELINE_HARVESTS,
  TIMELINE_TODAY,
  TIMELINE_WEATHER,
} from '@/social/visuals/timeline-sample';
import { TimelineSpan } from '@/social/visuals/timeline-span';
import '@/components/weather/day-forecast.css';
import '@/pages/harvest/timeline/harvest-timeline-grid.css';
import '@/social/visuals/cards.css';
import '@/social/visuals/timeline-card.css';

const ROW_HEIGHT = 85;
const TEMPLATE = `repeat(${TIMELINE_DAYS.length}, minmax(0, 1fr))`;
const MONTHS = monthNames(LANGUAGE);
const WEEKDAYS = weekdayShortNames(LANGUAGE);

function DayHead({ day, index }: { day: Date; index: number }) {
  const weather = TIMELINE_WEATHER[index];
  const kind = weatherIconKind(weather.code, '', true);

  return (
    <span className={toIsoDate(day) === TIMELINE_TODAY ? 'hcal-timeline-day today' : 'hcal-timeline-day'}>
      <span className="hcal-timeline-weekday">{WEEKDAYS[(day.getDay() + 6) % 7]}</span>
      <span className="hcal-timeline-date">{day.getDate()}</span>
      <span className={`day-forecast tone-${weatherTone(kind)}`}>
        <WeatherIcon kind={kind} className="day-forecast-glyph" width={24} height={24} />
        <span className="day-forecast-temps">
          <span className="day-forecast-max">{weather.max}°</span>
          <span className="day-forecast-min">{weather.min}°</span>
        </span>
      </span>
    </span>
  );
}

export function TimelineCard() {
  const spans = layoutSpans(TIMELINE_HARVESTS, TIMELINE_DAYS);
  const todayIndex = TIMELINE_DAYS.findIndex((day) => toIsoDate(day) === TIMELINE_TODAY);

  return (
    <div className="social-card timeline-card">
      <div className="hcal-timeline">
        <div className="hcal-timeline-months" style={{ gridTemplateColumns: TEMPLATE }}>
          {monthSegments(TIMELINE_DAYS).map((segment) => (
            <span
              key={segment.key}
              className="hcal-timeline-month"
              style={{ gridColumn: `${segment.startIndex + 1} / ${segment.endIndex + 2}` }}
            >
              {`${MONTHS[segment.month]} ${segment.year}`}
            </span>
          ))}
        </div>

        <div className="hcal-timeline-days" style={{ gridTemplateColumns: TEMPLATE }}>
          {TIMELINE_DAYS.map((day, index) => (
            <DayHead key={toIsoDate(day)} day={day} index={index} />
          ))}
        </div>

        <div
          className="hcal-timeline-body"
          style={{ backgroundSize: `100% ${ROW_HEIGHT}px, calc(100% / ${TIMELINE_DAYS.length}) 100%` }}
        >
          <div className="hcal-timeline-rows" style={{ gridTemplateColumns: TEMPLATE, gridAutoRows: ROW_HEIGHT }}>
            {spans.map((span) => (
              <TimelineSpan key={span.key} span={span} />
            ))}
          </div>

          <div className="hcal-timeline-today-layer" style={{ gridTemplateColumns: TEMPLATE }}>
            <span className="hcal-timeline-today" style={{ gridColumn: `${todayIndex + 1} / ${todayIndex + 2}` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
