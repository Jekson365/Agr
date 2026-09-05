import { isPicked } from '@/config/harvest-analysis';
import { HARVEST_STATUSES } from '@/config/harvest-status';
import type { HarvestStatus } from '@/types/harvest';
import type { TimelineHarvest, TimelineSource } from './harvest-timeline-spans';
import type { TargetOption } from './harvest-timeline-targets';

const STORAGE_KEY = 'farm.harvestTimeline.filters';

export type TimelineFilters = {
  query: string;
  status: HarvestStatus | 'all';
  kind: TimelineSource | 'all';
  target: string;
  hideCompleted: boolean;
};

export const EMPTY_FILTERS: TimelineFilters = {
  query: '',
  status: 'all',
  kind: 'all',
  target: 'all',
  hideCompleted: false,
};

const STATUS_VALUES: TimelineFilters['status'][] = ['all', ...HARVEST_STATUSES];

const KIND_VALUES: TimelineFilters['kind'][] = ['all', 'crop', 'fruit', 'greenhouse'];

function oneOf<T>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function readStoredFilters(): TimelineFilters {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_FILTERS;

    const saved = JSON.parse(raw) as Record<string, unknown>;
    return {
      query: typeof saved.query === 'string' ? saved.query : EMPTY_FILTERS.query,
      status: oneOf(saved.status, STATUS_VALUES, EMPTY_FILTERS.status),
      kind: oneOf(saved.kind, KIND_VALUES, EMPTY_FILTERS.kind),
      target: typeof saved.target === 'string' ? saved.target : EMPTY_FILTERS.target,
      hideCompleted:
        typeof saved.hideCompleted === 'boolean' ? saved.hideCompleted : EMPTY_FILTERS.hideCompleted,
    };
  } catch {
    return EMPTY_FILTERS;
  }
}

export function writeStoredFilters(filters: TimelineFilters) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
  } catch {
    return;
  }
}

export function isFiltering(filters: TimelineFilters): boolean {
  return (
    filters.query.trim() !== '' ||
    filters.status !== 'all' ||
    filters.kind !== 'all' ||
    filters.target !== 'all' ||
    filters.hideCompleted
  );
}

export function optionsForKind(options: TargetOption[], kind: TimelineFilters['kind']): TargetOption[] {
  if (kind === 'crop') return options.filter((option) => option.group === 'stock');
  if (kind === 'fruit') return options.filter((option) => option.group === 'tree');
  if (kind === 'greenhouse') return [];
  return options;
}

export function applyFilters(
  harvests: TimelineHarvest[],
  filters: TimelineFilters,
  targets: Map<string, Set<string>>
): TimelineHarvest[] {
  const query = filters.query.trim().toLowerCase();

  return harvests.filter((harvest) => {
    if (filters.hideCompleted && isPicked(harvest.status)) return false;
    if (filters.status !== 'all' && harvest.status !== filters.status) return false;
    if (filters.kind !== 'all' && harvest.source !== filters.kind) return false;
    if (filters.target !== 'all' && !targets.get(harvest.key)?.has(filters.target)) return false;
    if (query !== '' && !harvest.title.toLowerCase().includes(query)) return false;
    return true;
  });
}
