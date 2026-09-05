import { isOverdue } from '@/config/harvest-analysis';
import type { Harvest, HarvestStatus } from '@/types/harvest';

export type HarvestSortOrder = 'dateDesc' | 'dateAsc' | 'titleAsc' | 'expectedAsc';

export const HARVEST_SORT_OPTIONS: { value: HarvestSortOrder; labelKey: string }[] = [
  { value: 'dateDesc', labelKey: 'harvest.sortNewest' },
  { value: 'dateAsc', labelKey: 'harvest.sortOldest' },
  { value: 'titleAsc', labelKey: 'harvest.sortTitle' },
  { value: 'expectedAsc', labelKey: 'harvest.sortExpected' },
];

export type HarvestFilters = {
  search: string;
  status: HarvestStatus | null;
  overdueOnly: boolean;
  sort: HarvestSortOrder;
};

export const DEFAULT_HARVEST_FILTERS: HarvestFilters = {
  search: '',
  status: null,
  overdueOnly: false,
  sort: 'dateDesc',
};

export function filterHarvests(harvests: Harvest[], filters: HarvestFilters): Harvest[] {
  const term = filters.search.trim().toLowerCase();

  return harvests
    .filter((h) => (filters.status ? h.status === filters.status : true))
    .filter((h) => (filters.overdueOnly ? isOverdue(h) : true))
    .filter((h) => (term ? h.title.toLowerCase().includes(term) : true))
    .sort((a, b) => {
      if (filters.sort === 'dateAsc') return a.date.localeCompare(b.date);
      if (filters.sort === 'titleAsc') return a.title.localeCompare(b.title);
      if (filters.sort === 'expectedAsc') {
        if (a.expectedHarvestDate == null) return b.expectedHarvestDate == null ? 0 : 1;
        if (b.expectedHarvestDate == null) return -1;
        return a.expectedHarvestDate.localeCompare(b.expectedHarvestDate);
      }
      return b.date.localeCompare(a.date);
    });
}
