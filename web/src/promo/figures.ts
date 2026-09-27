import ka from '@/locales/ka.json';

export type Figure = { value: number; decimals: number; unit: string };

export function splitFigure(text: string): Figure {
  const match = /^([\d\s.,]+)(.*)$/.exec(text);
  if (!match) return { value: 0, decimals: 0, unit: text };
  const digits = match[1].replace(/[\s,]/g, '');
  const fraction = digits.split('.')[1] ?? '';
  return { value: Number(digits), decimals: fraction.length, unit: match[2].trim() };
}

export function formatCount(value: number, decimals = 0): string {
  if (decimals > 0) return value.toFixed(decimals);
  return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function countFigure(figure: Figure, amount: number): string {
  const text = formatCount(figure.value * amount, figure.decimals);
  return figure.unit ? `${text} ${figure.unit}` : text;
}

export function tr(key: string): string {
  const value = key
    .split('.')
    .reduce<unknown>(
      (node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined),
      ka
    );
  return typeof value === 'string' ? value : key;
}
