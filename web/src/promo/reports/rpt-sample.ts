import { TOMATO } from '@/promo/reports/rpt-timeline';

export type SampleHarvest = {
  date: string;
  type: string;
  kg: number;
  revenue: number;
  cost: number;
  fresh?: boolean;
};

export const HARVESTS: SampleHarvest[] = [
  { date: '2026-02-18', type: 'Beans', kg: 300, revenue: 1500, cost: 700 },
  { date: '2026-02-25', type: 'Corn', kg: 1100, revenue: 2300, cost: 1200 },
  { date: '2026-03-05', type: 'Eggplant', kg: 540, revenue: 1900, cost: 950 },
  { date: '2026-03-12', type: 'Cabbage', kg: 900, revenue: 2400, cost: 1300 },
  { date: '2026-03-20', type: 'Onion', kg: 650, revenue: 1700, cost: 900 },
  { date: '2026-03-28', type: 'Carrot', kg: 820, revenue: 2050, cost: 1100 },
  { date: '2026-04-02', type: 'Cucumber', kg: 760, revenue: 3100, cost: 1450 },
  { date: '2026-04-06', type: 'Potato', kg: 1500, revenue: 3600, cost: 2100 },
  { date: '2026-04-10', type: 'Tomato', kg: TOMATO.yieldKg, revenue: TOMATO.revenue, cost: TOMATO.cost, fresh: true },
];

export const NEWEST_FIRST = [...HARVESTS].reverse();

export const BY_YIELD = [...HARVESTS].sort((a, b) => b.kg - a.kg);

export const MOVES_PER_GOOD = 2;

export function dayMonth(iso: string): string {
  const [, month, day] = iso.split('-');
  return `${day}.${month}`;
}
