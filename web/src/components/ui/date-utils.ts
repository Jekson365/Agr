export type DateLanguage = 'en' | 'ka';

const MONTH_NAMES: Record<DateLanguage, string[]> = {
  en: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  ka: [
    'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
    'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი',
  ],
};

// Sunday-first, matching Date#getDay().
const WEEKDAY_NAMES: Record<DateLanguage, string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  ka: ['კვირა', 'ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი'],
};

/** Monday-first short names, for the calendar grid's column headers. */
const WEEKDAY_SHORT_NAMES: Record<DateLanguage, string[]> = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  ka: ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვ'],
};

export function monthNames(language: DateLanguage): string[] {
  return MONTH_NAMES[language];
}

/** Monday-first, so index 0 is Monday — matches the calendar grid's column order. */
export function weekdayShortNames(language: DateLanguage): string[] {
  return WEEKDAY_SHORT_NAMES[language];
}

/** Formats a Date using the app's own month/weekday names for the given language, e.g.
 * "19 July 2026" / "19 ივლისი 2026", instead of the browser's ambient locale (which usually
 * isn't Georgian even when the in-app language is). */
export function formatLocalizedDate(
  date: Date,
  language: DateLanguage,
  options?: { weekday?: boolean; year?: boolean }
): string {
  const parts: string[] = [];
  if (options?.weekday) parts.push(`${WEEKDAY_NAMES[language][date.getDay()]},`);
  parts.push(String(date.getDate()));
  parts.push(MONTH_NAMES[language][date.getMonth()]);
  if (options?.year !== false) parts.push(String(date.getFullYear()));
  return parts.join(' ');
}

/** Parses a `YYYY-MM-DD` or ISO datetime string and formats it with {@link formatLocalizedDate},
 * falling back to the raw string when missing/invalid. */
export function formatLocalizedIsoDate(
  value: string | null | undefined,
  language: DateLanguage,
  options?: { weekday?: boolean; year?: boolean }
): string {
  const date = parseIsoDate(value);
  return date ? formatLocalizedDate(date, language, options) : (value ?? '');
}

/** Builds a 6-week grid of dates covering the given month, in Monday-first weeks. */
export function buildMonthGrid(year: number, month: number): Date[] {
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

/** Today as a local `YYYY-MM-DD` string. */
export function todayIsoDate(): string {
  return toIsoDate(new Date());
}

/** Formats a Date as a local `YYYY-MM-DD` string (no timezone shift). */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parses a `YYYY-MM-DD` date or a full ISO datetime string into a Date, or null when
 * missing/invalid. Date-only strings are treated as local midnight; datetime strings (as
 * returned for `DateTime` fields like `AnimalProduction.collectionDate`) are parsed as-is. */
export function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Parses just the calendar day out of a `YYYY-MM-DD` or ISO datetime string, as local midnight.
 * Fields that carry a plain date but are stored as a timestamp (e.g. `AnimalProduction.collectionDate`,
 * saved at UTC midnight) would otherwise read back as the previous day for anyone west of UTC,
 * which also moves them across year/quarter boundaries when reports are filtered. */
export function parseIsoDay(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** {@link formatLocalizedIsoDate} for date-only fields — see {@link parseIsoDay}. */
export function formatLocalizedIsoDay(
  value: string | null | undefined,
  language: DateLanguage,
  options?: { weekday?: boolean; year?: boolean }
): string {
  const date = parseIsoDay(value);
  return date ? formatLocalizedDate(date, language, options) : (value ?? '');
}

/** Formats a `HH:mm` or `HH:mm:ss` time string. English uses a 12-hour clock ("9:30 AM");
 * Georgian has no common AM/PM equivalent, so it uses a 24-hour clock ("09:30"). Deliberately
 * not `toLocaleTimeString`, which would follow the browser locale and leave an English-language
 * clock on a Georgian page. */
export function formatTime(time: string, language: DateLanguage): string {
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;

  if (language === 'ka') {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  const suffix = hours < 12 ? 'AM' : 'PM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

/** Formats a date-time for display, e.g. "19 July 2026, 9:30 AM". */
export function formatLocalizedIsoDateTime(value: string | null | undefined, language: DateLanguage): string {
  const date = parseIsoDate(value);
  if (!date) return value ?? '';
  const time = formatTime(`${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`, language);
  return `${formatLocalizedDate(date, language)}, ${time}`;
}
