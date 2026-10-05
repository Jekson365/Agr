import type { WineMeasurement } from '@/types/wine';

export type ReadingKey = 'sugar' | 'temperature' | 'alcohol' | 'acidity' | 'ph' | 'freeSo2' | 'totalSo2';

type ReadingField = {
  key: ReadingKey;
  labelKey: string;
  min: number;
  max: number;
  short: (value: number, t: (key: string) => string) => string;
};

export const READING_FIELDS: ReadingField[] = [
  { key: 'sugar', labelKey: 'wine.sugar', min: 0, max: 40, short: (v, t) => `${t('wine.sugarShort')} ${v}%` },
  { key: 'temperature', labelKey: 'wine.temperature', min: -10, max: 60, short: (v) => `${v}°C` },
  { key: 'alcohol', labelKey: 'wine.alcohol', min: 0, max: 25, short: (v, t) => `${t('wine.alcoholShort')} ${v}%` },
  { key: 'acidity', labelKey: 'wine.acidity', min: 0, max: 30, short: (v, t) => `${t('wine.acidityShort')} ${v}` },
  { key: 'ph', labelKey: 'wine.ph', min: 0, max: 14, short: (v) => `pH ${v}` },
  { key: 'freeSo2', labelKey: 'wine.freeSo2', min: 0, max: 500, short: (v, t) => `${t('wine.so2Short')} ${v}` },
  { key: 'totalSo2', labelKey: 'wine.totalSo2', min: 0, max: 500, short: (v, t) => `${t('wine.so2Short')} Σ ${v}` },
];

export function readingSummary(measurement: WineMeasurement, t: (key: string) => string): string {
  return READING_FIELDS.flatMap((field) => {
    const value = measurement[field.key];
    return value == null ? [] : [field.short(value, t)];
  }).join(' · ');
}

export function shortDay(iso: string): string {
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)}`;
}
