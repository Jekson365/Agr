import type { AnimalProduction } from '@/types/animal-production';
import type { ProductionMovement } from '@/types/production-movement';
import { isInPeriod, type Period } from './production-period';

/**
 * One line of the table: a collection batch, or a marketplace sale drawn against the same
 * type/unit balance. The two are interleaved by date rather than listed separately, so a sale
 * reads in sequence with the batches it drew down.
 */
export type ProductionRow =
  | { kind: 'record'; key: string; date: string; record: AnimalProduction }
  | { kind: 'sale'; key: string; date: string; movement: ProductionMovement };

/** What the list is currently narrowed to. */
export type RowFilters = {
  period: Period;
  typeFilter: number | null;
  animalFilter: number | null;
};

export type RowSource = {
  records: AnimalProduction[];
  /** Group view only: records added on one specific animal of the group. */
  singleRecords: AnimalProduction[];
  /** Group view only: marketplace sales of the types this group produces. */
  saleMovements: ProductionMovement[];
  /** Whether the individual animals' records are merged in. */
  showSingles: boolean;
  isGroup: boolean;
};

export function buildProductionRows(source: RowSource, filters: RowFilters): ProductionRow[] {
  const { records, singleRecords, saleMovements, showSingles, isGroup } = source;
  const { period, typeFilter, animalFilter } = filters;

  // Group records merged with the animals' own records (if shown), filtered, newest first.
  const visibleRecords = [...records, ...(isGroup && showSingles ? singleRecords : [])]
    .filter((record) => isInPeriod(period, record.collectionDate))
    .filter((record) => typeFilter == null || record.productionTypeId === typeFilter)
    .filter((record) => animalFilter == null || record.animalId === animalFilter)
    .sort((a, b) => b.collectionDate.localeCompare(a.collectionDate) || b.id - a.id);

  // Marketplace sales are not tied to an animal, so they drop out under an animal filter.
  const visibleSales =
    animalFilter == null
      ? saleMovements
          .filter((movement) => isInPeriod(period, movement.createdAt, false))
          .filter((movement) => typeFilter == null || movement.productionTypeId === typeFilter)
      : [];

  return [
    ...visibleRecords.map(
      (record): ProductionRow => ({ kind: 'record', key: `r${record.id}`, date: record.collectionDate, record })
    ),
    ...visibleSales.map(
      (movement): ProductionRow => ({ kind: 'sale', key: `s${movement.id}`, date: movement.createdAt, movement })
    ),
  ].sort((a, b) => b.date.localeCompare(a.date));
}

/** Animals of this group that actually have their own records — the animal filter's options. */
export function animalsWithOwnRecords(
  singleRecords: AnimalProduction[],
  animalCodeById: Map<number, string>
): { id: number; code: string }[] {
  return [...new Set(singleRecords.map((record) => record.animalId))]
    .filter((id): id is number => id != null)
    .map((id) => ({ id, code: animalCodeById.get(id) ?? `#${id}` }));
}
