import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import '@/components/harvest/harvest.css';
import { ChevronLeftIcon, ChevronRightIcon, LeafIcon, PlusIcon } from '@/components/icons/misc-icons';
import { formatLocalizedDate, formatTime, monthNames, toIsoDate, weekdayShortNames } from '@/components/ui/date-utils';
import { isOverdue } from '@/config/harvest-analysis';
import { HARVEST_STATUS_BADGE_CLASS, HARVEST_STATUS_LABEL_KEY } from '@/config/harvest-status';
import { useLanguage } from '@/contexts/language-context';
import { createCalendarEvent, deleteCalendarEvent, getCalendarEvents } from '@/services/calendar-service';
import { getHarvests } from '@/services/harvest-service';
import type { CalendarEvent } from '@/types/calendar';
import type { Harvest } from '@/types/harvest';
import './calendar-page.css';

function currentHhMm(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Builds a 6-week grid of dates covering the given month (Monday-first weeks). */
function buildMonthGrid(year: number, month: number): Date[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;

  const days: Date[] = [];
  const cursor = new Date(year, month, 1 - startOffset);
  for (let i = 0; i < 42; i++) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function CalendarPage() {
  const { t, language } = useLanguage();
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState(today);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventInput, setEventInput] = useState('');
  const [eventTime, setEventTime] = useState(currentHhMm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const days = useMemo(() => buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);
  const months = monthNames(language);
  const weekdayNames = weekdayShortNames(language);

  const selectedKey = toIsoDate(selected);
  const selectedEvents = events.filter((e) => e.date === selectedKey);

  // A harvest lands on the calendar twice when the two differ: on its record date, and on the
  // date it's expected to be picked. `expected` distinguishes which occurrence a row is.
  type HarvestOccurrence = { harvest: Harvest; date: string; expected: boolean };
  const occurrences = useMemo<HarvestOccurrence[]>(
    () =>
      harvests.flatMap((harvest) => {
        const rows: HarvestOccurrence[] = [{ harvest, date: harvest.date, expected: false }];
        if (harvest.expectedHarvestDate && harvest.expectedHarvestDate !== harvest.date) {
          rows.push({ harvest, date: harvest.expectedHarvestDate, expected: true });
        }
        return rows;
      }),
    [harvests]
  );

  const selectedHarvests = occurrences.filter((o) => o.date === selectedKey);
  const eventDates = useMemo(() => new Set(events.map((e) => e.date)), [events]);
  const harvestDates = useMemo(() => new Set(occurrences.map((o) => o.date)), [occurrences]);
  // Days carrying an overdue harvest get the danger marker instead of the normal harvest one.
  const overdueDates = useMemo(
    () => new Set(occurrences.filter((o) => isOverdue(o.harvest)).map((o) => o.date)),
    [occurrences]
  );

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [eventList, harvestList] = await Promise.all([getCalendarEvents(), getHarvests()]);
      setEvents(eventList);
      setHarvests(harvestList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function goPrevMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goNextMonth() {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function selectDate(date: Date) {
    setSelected(date);
    setEventInput('');
    setEventTime(currentHhMm());
    setSaveError(null);
  }

  async function addEvent() {
    const title = eventInput.trim();
    if (!title || saving) return;

    setSaving(true);
    setSaveError(null);
    try {
      const created = await createCalendarEvent({ title, date: selectedKey, time: eventTime });
      setEvents((prev) => [...prev, created]);
      setEventInput('');
      setEventTime(currentHhMm());
    } catch {
      setSaveError(t('calendar.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function removeEvent(id: number) {
    const previous = events;
    setEvents((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteCalendarEvent(id);
    } catch {
      setEvents(previous);
      setSaveError(t('calendar.saveError'));
    }
  }

  return (
    <div className="calendar-page">
      <div className="page-header">
        <h1 className="page-title">{t('dashboard.calendar')}</h1>
      </div>

      <div className="calendar-layout">
        <div className="calendar-events-panel">
          <div className="calendar-events-title">
            {formatLocalizedDate(selected, language, { weekday: true, year: false })}
          </div>

          {loading ? (
            <div className="state-box">…</div>
          ) : error ? (
            <div className="state-box">
              <span>{t('calendar.loadError')}</span>
              <button type="button" className="retry-button" onClick={load}>
                {t('common.retry')}
              </button>
            </div>
          ) : (
            <>
              {selectedHarvests.length > 0 && (
                <div className="calendar-harvests-list">
                  {selectedHarvests.map(({ harvest: item, expected }) => (
                    <Link
                      key={`${item.id}-${expected ? 'expected' : 'record'}`}
                      to={`/harvest/detail/${item.id}`}
                      className="calendar-harvest-row"
                    >
                      <span className="calendar-harvest-row-left">
                        <LeafIcon width={16} height={16} />
                        <span className="calendar-harvest-row-text">{item.title}</span>
                        {expected && (
                          <span className={isOverdue(item) ? 'calendar-harvest-tag overdue' : 'calendar-harvest-tag'}>
                            {isOverdue(item) ? t('harvest.overdue') : t('harvest.expectedTag')}
                          </span>
                        )}
                      </span>
                      <span className={HARVEST_STATUS_BADGE_CLASS[item.status]}>{t(HARVEST_STATUS_LABEL_KEY[item.status])}</span>
                    </Link>
                  ))}
                </div>
              )}

              <div className="field calendar-event-title-field">
                <input
                  value={eventInput}
                  onChange={(e) => setEventInput(e.target.value)}
                  placeholder={t('calendar.addPlaceholder')}
                  disabled={saving}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addEvent();
                  }}
                />
              </div>

              <div className="calendar-event-form-row">
                <div className="field">
                  <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
                </div>
                <button
                  type="button"
                  className="calendar-event-add-button"
                  onClick={addEvent}
                  disabled={!eventInput.trim() || saving}
                  aria-label={t('calendar.addEvent')}
                >
                  <PlusIcon width={20} height={20} />
                </button>
              </div>

              {saveError && <div className="error-banner">{saveError}</div>}

              {selectedEvents.length === 0 ? (
                <p className="empty-state">{t('calendar.empty')}</p>
              ) : (
                selectedEvents.map((item) => (
                  <div key={item.id} className="calendar-event-row">
                    <span className="calendar-event-row-left">
                      <span className="calendar-event-row-time">{formatTime(item.time, language)}</span>
                      <span className="calendar-event-row-text">{item.title}</span>
                    </span>
                    <button
                      type="button"
                      className="calendar-event-remove"
                      onClick={() => removeEvent(item.id)}
                      aria-label={t('calendar.removeEvent')}
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </>
          )}
        </div>

        <div className="calendar-main">
          <div className="calendar-month-nav">
            <button type="button" className="calendar-month-nav-button" onClick={goPrevMonth} aria-label={t('calendar.previousMonth')}>
              <ChevronLeftIcon width={20} height={20} />
            </button>
            <span className="calendar-month-label">
              {months[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button type="button" className="calendar-month-nav-button" onClick={goNextMonth} aria-label={t('calendar.nextMonth')}>
              <ChevronRightIcon width={20} height={20} />
            </button>
          </div>

          <div className="calendar-weekday-row">
            {weekdayNames.map((label) => (
              <span key={label} className="calendar-weekday-label">
                {label}
              </span>
            ))}
          </div>

          <div className="calendar-grid">
            {days.map((date) => {
              const inMonth = date.getMonth() === viewDate.getMonth();
              const isToday = isSameDay(date, today);
              const isSelected = isSameDay(date, selected);
              const hasEvent = eventDates.has(toIsoDate(date));
              const hasHarvest = harvestDates.has(toIsoDate(date));
              const hasOverdue = overdueDates.has(toIsoDate(date));

              const circleClass = [
                'calendar-day-circle',
                hasEvent && !isSelected ? 'marked-event' : hasHarvest && !isSelected ? 'marked-harvest' : '',
                isToday && !isSelected ? 'today' : '',
                isSelected ? 'selected' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  className={inMonth ? 'calendar-day-cell' : 'calendar-day-cell muted'}
                  onClick={() => selectDate(date)}
                >
                  <span className={circleClass}>{date.getDate()}</span>
                  {(hasEvent || hasHarvest) && (
                    <span className="calendar-day-dots">
                      {hasEvent && <span className={isSelected ? 'calendar-day-dot event selected' : 'calendar-day-dot event'} />}
                      {hasHarvest && (
                        <span
                          className={[
                            'calendar-day-dot',
                            hasOverdue ? 'overdue' : 'harvest',
                            isSelected ? 'selected' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        />
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
