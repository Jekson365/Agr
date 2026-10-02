import { formatLocalizedDate, monthNames, type DateLanguage } from '@/components/ui/date-utils';
import type { VisitBucketUnit } from '@/types/visit';

type Translate = (key: string, params?: Record<string, string | number>) => string;

const regionNames = new Map<string, Intl.DisplayNames | null>();

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function displayNames(language: string): Intl.DisplayNames | null {
  if (!regionNames.has(language)) {
    try {
      regionNames.set(language, new Intl.DisplayNames([language], { type: 'region' }));
    } catch {
      regionNames.set(language, null);
    }
  }
  return regionNames.get(language) ?? null;
}

export function countryName(code: string, fallback: string, language: string): string {
  if (!code) return fallback;
  try {
    return displayNames(language)?.of(code.toUpperCase()) ?? fallback;
  } catch {
    return fallback;
  }
}

export function placeLabel(city: string, countryCode: string, country: string, language: string, t: Translate): string {
  const nation = countryName(countryCode, country, language);
  if (!nation) return t('visitors.unknown');
  return city ? `${city}, ${nation}` : nation;
}

export function orUnknown(value: string, t: Translate): string {
  return value || t('visitors.unknown');
}

export function sourceLabel(source: string, t: Translate): string {
  return source || t('visitors.direct');
}

export function deviceLabel(device: string, t: Translate): string {
  return t(`visitors.device${device}`);
}

export function formatCount(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function formatClock(value: string): string {
  const date = new Date(value);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function formatDuration(from: string, to: string): string {
  const total = Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

export function bucketLabel(start: string, unit: VisitBucketUnit): string {
  const date = new Date(start);
  switch (unit) {
    case 'Hour':
      return `${pad(date.getHours())}:00`;
    case 'Day':
    case 'Week':
      return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}`;
    case 'Month':
      return `${pad(date.getMonth() + 1)}.${String(date.getFullYear()).slice(2)}`;
  }
}

export function bucketTooltip(start: string, unit: VisitBucketUnit, language: DateLanguage): string {
  const date = new Date(start);
  switch (unit) {
    case 'Hour':
      return `${formatLocalizedDate(date, language, { year: false })}, ${pad(date.getHours())}:00`;
    case 'Day':
      return formatLocalizedDate(date, language, { weekday: true });
    case 'Week': {
      const last = new Date(date);
      last.setDate(last.getDate() + 6);
      return `${formatLocalizedDate(date, language, { year: false })} – ${formatLocalizedDate(last, language)}`;
    }
    case 'Month':
      return `${monthNames(language)[date.getMonth()]} ${date.getFullYear()}`;
  }
}
