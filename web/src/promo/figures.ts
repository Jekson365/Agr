import { LANGUAGE } from '@/promo/locale';

export type Figure = { prefix: string; value: number; decimals: number; unit: string };

export function splitFigure(text: string): Figure {
  const match = /^(\D*?)([\d\s.,]+)(.*)$/.exec(text);
  if (!match) return { prefix: '', value: 0, decimals: 0, unit: text };
  const digits = match[2].replace(/[\s,]/g, '');
  const fraction = digits.split('.')[1] ?? '';
  return { prefix: match[1], value: Number(digits), decimals: fraction.length, unit: match[3].trim() };
}

export function formatCount(value: number, decimals = 0): string {
  if (decimals > 0) return value.toFixed(decimals);
  if (LANGUAGE === 'en') return Math.round(value).toLocaleString('en-US');
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function countFigure(figure: Figure, amount: number): string {
  const text = figure.prefix + formatCount(figure.value * amount, figure.decimals);
  return figure.unit ? `${text} ${figure.unit}` : text;
}
