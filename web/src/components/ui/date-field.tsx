import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/misc-icons';
import {
  buildMonthGrid,
  formatLocalizedDate,
  monthNames,
  parseIsoDate,
  toIsoDate,
  weekdayShortNames,
} from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import './date-field.css';

type Props = {
  /** Selected date as a `YYYY-MM-DD` string, or null/'' when unset. */
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  /** Inclusive bounds as `YYYY-MM-DD`. Days outside them can't be picked. */
  min?: string;
  max?: string;
  /** Shows an ✕ to unset the value. On by default — pass false where a date is required. */
  clearable?: boolean;
  disabled?: boolean;
};

const POPUP_WIDTH = 280;
const POPUP_MAX_HEIGHT = 340;

/**
 * Date picker that renders its own calendar in the app's language.
 *
 * A native `<input type="date">` takes its display format and popup language from the browser's
 * locale, which no page-level attribute can override — so switching the app to Georgian left
 * every date field English. This draws the calendar itself instead. The value stays a plain
 * `YYYY-MM-DD` string, so callers are unchanged from the native input they replaced.
 */
export function DateField({ value, onChange, placeholder, min, max, clearable = true, disabled }: Props) {
  const { t, language } = useLanguage();

  const selected = parseIsoDate(value);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => selected ?? new Date());
  const [rect, setRect] = useState<{ top: number; left: number } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const months = monthNames(language);
  const weekdays = weekdayShortNames(language);
  const days = useMemo(() => buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth()), [viewDate]);

  // Re-centre the view on the selected month each time the popup opens, so reopening a field
  // doesn't leave you wherever you last browsed to.
  useEffect(() => {
    if (open) setViewDate(parseIsoDate(value) ?? new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // The popup is portalled to <body> and positioned from the trigger's rect, so it can't be
  // clipped by a scrolling modal or an overflow-hidden ancestor.
  useLayoutEffect(() => {
    if (!open) return;

    function place() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const box = trigger.getBoundingClientRect();

      // Flip above the field when there isn't room below it.
      const below = window.innerHeight - box.bottom;
      const top = below < POPUP_MAX_HEIGHT && box.top > below ? box.top - POPUP_MAX_HEIGHT - 6 : box.bottom + 6;
      const left = Math.min(Math.max(8, box.left), window.innerWidth - POPUP_WIDTH - 8);
      setRect({ top: Math.max(8, top), left });
    }

    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popupRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function isDisabledDay(iso: string): boolean {
    // Lexicographic comparison is exact for `YYYY-MM-DD`.
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return false;
  }

  function pick(date: Date) {
    const iso = toIsoDate(date);
    if (isDisabledDay(iso)) return;
    onChange(iso);
    setOpen(false);
  }

  const todayIso = toIsoDate(new Date());
  const selectedIso = selected ? toIsoDate(selected) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={open ? 'date-field open' : 'date-field'}
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
      >
        <CalendarIcon width={16} height={16} />
        <span className={selected ? 'date-field-text' : 'date-field-text placeholder'}>
          {selected ? formatLocalizedDate(selected, language) : (placeholder ?? t('harvest.datePlaceholder'))}
        </span>
        {clearable && selected && !disabled && (
          <span
            className="date-field-clear"
            role="button"
            tabIndex={-1}
            aria-label={t('common.clear')}
            onClick={(e) => {
              // Don't let the click reach the trigger and toggle the popup open.
              e.stopPropagation();
              onChange(null);
              setOpen(false);
            }}
          >
            ✕
          </span>
        )}
      </button>

      {open &&
        rect &&
        createPortal(
          <div ref={popupRef} className="date-popup" style={{ top: rect.top, left: rect.left, width: POPUP_WIDTH }}>
            <div className="date-popup-nav">
              <button
                type="button"
                className="date-popup-nav-button"
                onClick={() => setViewDate((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))}
                aria-label={t('calendar.previousMonth')}
              >
                <ChevronLeftIcon width={18} height={18} />
              </button>
              <span className="date-popup-label">
                {months[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <button
                type="button"
                className="date-popup-nav-button"
                onClick={() => setViewDate((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))}
                aria-label={t('calendar.nextMonth')}
              >
                <ChevronRightIcon width={18} height={18} />
              </button>
            </div>

            <div className="date-popup-weekdays">
              {weekdays.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="date-popup-grid">
              {days.map((date) => {
                const iso = toIsoDate(date);
                const className = [
                  'date-popup-day',
                  date.getMonth() === viewDate.getMonth() ? '' : 'muted',
                  iso === todayIso ? 'today' : '',
                  iso === selectedIso ? 'selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <button
                    key={iso}
                    type="button"
                    className={className}
                    disabled={isDisabledDay(iso)}
                    onClick={() => pick(date)}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="date-popup-footer">
              <button
                type="button"
                className="date-popup-today"
                disabled={isDisabledDay(todayIso)}
                onClick={() => pick(new Date())}
              >
                {t('common.today')}
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
