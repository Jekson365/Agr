import type { TreeSpotTreatment } from '@/types/tree-spot-treatment';
import type { PickedTree } from './treatment-plan-shape';

/**
 * One application as it was recorded: a date, a type and a note given to a set of trees at once.
 * The table keeps a row per tree — that is what makes "what has this tree had" a plain filter — so
 * the list gathers them back into the entry the farmer actually made.
 */
export type SpotGroup = {
  key: string;
  date: string;
  type: string;
  note: string;
  ids: number[];
  trees: PickedTree[];
};

export function groupSpots(rows: TreeSpotTreatment[]): SpotGroup[] {
  const groups = new Map<string, SpotGroup>();

  for (const row of rows) {
    const key = `${row.date.slice(0, 10)}|${row.type}|${row.note}`;
    const existing = groups.get(key);
    const tree: PickedTree = { index: row.treeIndex, lat: row.latitude, lng: row.longitude };

    if (existing) {
      existing.ids.push(row.id);
      existing.trees.push(tree);
      continue;
    }

    groups.set(key, {
      key,
      date: row.date,
      type: row.type,
      note: row.note,
      ids: [row.id],
      trees: [tree],
    });
  }

  // Newest first, and the same order for two entries made on one day — the list is read as a
  // history, so a stable order matters more than which of the two came first.
  return [...groups.values()].sort((a, b) => b.date.localeCompare(a.date) || b.ids[0] - a.ids[0]);
}
