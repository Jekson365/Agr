import type { DateLanguage } from '@/components/ui/date-utils';
import en from '@/locales/en.json';
import ka from '@/locales/ka.json';
import { EN_GAPS } from '@/promo/en-gaps';

export const LANGUAGE: Extract<DateLanguage, 'ka' | 'en'> =
  new URLSearchParams(window.location.search).get('lang') === 'en' ? 'en' : 'ka';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function overlay<T>(base: T, patch: unknown): T {
  if (!isRecord(base) || !isRecord(patch)) return (patch ?? base) as T;
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) merged[key] = overlay(merged[key], value);
  return merged as T;
}

export const copy: typeof ka = LANGUAGE === 'en' ? overlay(overlay(ka, en), EN_GAPS) : ka;

export function tr(key: string): string {
  const value = key.split('.').reduce<unknown>((node, part) => (isRecord(node) ? node[part] : undefined), copy);
  return typeof value === 'string' ? value : key;
}
