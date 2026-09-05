import { toIsoDate } from '@/components/ui/date-utils';
import { isOverdue } from '@/config/harvest-analysis';
import type { GreenhouseHarvest } from '@/types/greenhouse-harvest';
import type { Harvest, HarvestStatus } from '@/types/harvest';

export const MIN_DAYS = 3;
export const MAX_DAYS = 180;
export const MONTHS_ONLY_FROM = 60;

export type TimelineSource = 'crop' | 'fruit' | 'greenhouse';

export type TimelineHarvest = {
  key: string;
  title: string;
  start: string;
  end: string;
  status: HarvestStatus;
  source: TimelineSource;
  path: string;
  overdue: boolean;
};

export type PlacedSpan = TimelineHarvest & {
  startIndex: number;
  endIndex: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
  lane: number;
};

export function harvestIdOf(harvest: TimelineHarvest): number {
  return Number(harvest.key.split('-')[1]);
}

function range(harvest: { date: string; expectedHarvestDate: string | null }) {
  const expected = harvest.expectedHarvestDate;
  const start = expected && expected < harvest.date ? expected : harvest.date;
  const end = expected && expected > harvest.date ? expected : harvest.date;
  return { start: start.slice(0, 10), end: end.slice(0, 10) };
}

export function fromHarvest(harvest: Harvest): TimelineHarvest {
  const fruit = harvest.kind === 'Fruit';
  const key = `${fruit ? 'fruit' : 'crop'}-${harvest.id}`;
  return {
    key,
    title: harvest.title,
    ...range(harvest),
    status: harvest.status,
    source: fruit ? 'fruit' : 'crop',
    path: fruit ? `/farm/fruits/harvest/${harvest.id}` : `/harvest/detail/${harvest.id}`,
    overdue: isOverdue(harvest),
  };
}

export function fromGreenhouseHarvest(harvest: GreenhouseHarvest): TimelineHarvest {
  const key = `greenhouse-${harvest.id}`;
  return {
    key,
    title: harvest.title,
    ...range(harvest),
    status: harvest.status,
    source: 'greenhouse',
    path: `/farm/greenhouse/harvest/${harvest.id}`,
    overdue: isOverdue(harvest),
  };
}

export function buildDays(anchor: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(anchor);
    day.setDate(anchor.getDate() + index);
    return day;
  });
}

export function layoutSpans(items: TimelineHarvest[], days: Date[]): PlacedSpan[] {
  if (days.length === 0) return [];

  const first = toIsoDate(days[0]);
  const last = toIsoDate(days[days.length - 1]);
  const indexByDate = new Map(days.map((day, index) => [toIsoDate(day), index]));

  const ordered = [...items].sort(
    (a, b) => harvestIdOf(b) - harvestIdOf(a) || a.key.localeCompare(b.key)
  );

  return ordered
    .map((item, lane) => ({ item, lane }))
    .filter(({ item }) => item.start <= last && item.end >= first)
    .map(({ item, lane }) => ({
      ...item,
      startIndex: indexByDate.get(item.start) ?? 0,
      endIndex: indexByDate.get(item.end) ?? days.length - 1,
      continuesBefore: item.start < first,
      continuesAfter: item.end > last,
      lane,
    }));
}

export function laneCount(spans: PlacedSpan[]): number {
  return spans.reduce((max, span) => Math.max(max, span.lane + 1), 0);
}

export function clampDays(count: number): number {
  return Math.min(MAX_DAYS, Math.max(MIN_DAYS, count));
}

export type MonthSegment = {
  key: string;
  month: number;
  year: number;
  startIndex: number;
  endIndex: number;
};

export function monthSegments(days: Date[]): MonthSegment[] {
  const segments: MonthSegment[] = [];
  days.forEach((day, index) => {
    const last = segments[segments.length - 1];
    if (last && last.month === day.getMonth() && last.year === day.getFullYear()) {
      last.endIndex = index;
      return;
    }
    segments.push({
      key: `${day.getFullYear()}-${day.getMonth()}`,
      month: day.getMonth(),
      year: day.getFullYear(),
      startIndex: index,
      endIndex: index,
    });
  });
  return segments;
}
