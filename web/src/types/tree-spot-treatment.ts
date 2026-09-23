/** One tree of an orchard's planting plan, as a record points at it. The index is the plan's own
 *  order; the coordinates are where that tree stood when the record was written, and are what still
 *  say where it was once a block is laid out again. */
export type TreeSpotTarget = {
  index: number;
  latitude: number;
  longitude: number;
};

/** A treatment given to one tree rather than to the whole orchard. */
export type TreeSpotTreatment = {
  id: number;
  treeStockId: number;
  treeIndex: number;
  latitude: number;
  longitude: number;
  date: string;
  type: string;
  note: string;
  createdAt: string;
};

/** One application over several trees at once. The server fans it out to a row per tree. */
export type TreeSpotTreatmentBatch = {
  treeStockId: number;
  date: string;
  type: string;
  note: string;
  trees: TreeSpotTarget[];
};
