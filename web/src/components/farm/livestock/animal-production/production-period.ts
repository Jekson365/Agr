import { parseIsoDate, parseIsoDay } from '@/components/ui/date-utils';

export type PeriodMode = 'all' | 'year' | 'quarter' | 'custom';
export type Quarter = 1 | 2 | 3 | 4;

/** The date window the production list is narrowed to. */
export type Period = {
  mode: PeriodMode;
  year: number;
  quarter: Quarter;
  /** Custom-range bounds, `YYYY-MM-DD`. Only read while `mode` is 'custom'. */
  from: string | null;
  to: string | null;
};

export const PERIOD_OPTIONS: { value: PeriodMode; labelKey: string }[] = [
  { value: 'all', labelKey: 'report.periodAll' },
  { value: 'year', labelKey: 'report.periodYear' },
  { value: 'quarter', labelKey: 'report.periodQuarter' },
  { value: 'custom', labelKey: 'report.periodCustom' },
];

export const QUARTER_OPTIONS: { value: Quarter; labelKey: string }[] = [
  { value: 1, labelKey: 'report.quarterQ1' },
  { value: 2, labelKey: 'report.quarterQ2' },
  { value: 3, labelKey: 'report.quarterQ3' },
  { value: 4, labelKey: 'report.quarterQ4' },
];

/** Everything shown to begin with, with the year and quarter fields already on today's — so
 * switching to either of those narrows to the current one rather than to an arbitrary date. */
export function makeDefaultPeriod(): Period {
  const now = new Date();
  return {
    mode: 'all',
    year: now.getFullYear(),
    quarter: (Math.floor(now.getMonth() / 3) + 1) as Quarter,
    from: null,
    to: null,
  };
}

/**
 * Whether a date falls inside the window. `dayOnly` for fields that carry a plain date stored as
 * UTC midnight (collection dates); sale movements carry a real timestamp, which is compared in
 * local time.
 */
export function isInPeriod(period: Period, dateIso: string, dayOnly = true): boolean {
  const date = dayOnly ? parseIsoDay(dateIso) : parseIsoDate(dateIso);
  if (!date) return false;

  if (period.mode === 'year') {
    return date.getFullYear() === period.year;
  }
  if (period.mode === 'quarter') {
    return date.getFullYear() === period.year && Math.floor(date.getMonth() / 3) + 1 === period.quarter;
  }
  if (period.mode === 'custom') {
    const from = parseIsoDay(period.from);
    const to = parseIsoDay(period.to);
    if (from && date < from) return false;
    // `to` is midnight of the end day, so a same-day record must still count as inside.
    if (to && date > new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59)) return false;
    return true;
  }
  return true;
}
