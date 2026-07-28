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

/** Formats a Date using the app's own month/weekday names for the given language, e.g.
 * "19 July 2026" / "19 ივლისი 2026", instead of the device's ambient locale (which usually
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

/** Formats a `HH:mm` or `HH:mm:ss` time string for display (e.g. "9:30 AM"). */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
