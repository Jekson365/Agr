import { formatLocalizedDate, monthNames, parseIsoDay, toIsoDate, type DateLanguage } from '@/components/ui/date-utils';
import type { SalesBucketUnit } from '@/types/market-sale';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function addUnits(date: Date, unit: SalesBucketUnit, count: number): Date {
  const next = new Date(date);
  switch (unit) {
    case 'Day':
      next.setDate(next.getDate() + count);
      break;
    case 'Week':
      next.setDate(next.getDate() + count * 7);
      break;
    case 'Month':
      next.setMonth(next.getMonth() + count);
      break;
    case 'Year':
      next.setFullYear(next.getFullYear() + count);
      break;
  }
  return next;
}

export function bucketLabel(start: string, unit: SalesBucketUnit): string {
  const date = parseIsoDay(start);
  if (!date) return start;
  switch (unit) {
    case 'Day':
    case 'Week':
      return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}`;
    case 'Month':
      return `${pad(date.getMonth() + 1)}.${String(date.getFullYear()).slice(2)}`;
    case 'Year':
      return String(date.getFullYear());
  }
}

export function bucketTooltip(start: string, unit: SalesBucketUnit, language: DateLanguage): string {
  const date = parseIsoDay(start);
  if (!date) return start;
  switch (unit) {
    case 'Day':
      return formatLocalizedDate(date, language);
    case 'Week': {
      const last = addUnits(date, 'Day', 6);
      return `${formatLocalizedDate(date, language, { year: false })} – ${formatLocalizedDate(last, language)}`;
    }
    case 'Month':
      return `${monthNames(language)[date.getMonth()]} ${date.getFullYear()}`;
    case 'Year':
      return String(date.getFullYear());
  }
}

export function bucketRange(start: string, unit: SalesBucketUnit): { from: string; to: string } {
  const date = parseIsoDay(start);
  if (!date) return { from: start, to: start };
  const end = addUnits(addUnits(date, unit, 1), 'Day', -1);
  return { from: toIsoDate(date), to: toIsoDate(end) };
}
