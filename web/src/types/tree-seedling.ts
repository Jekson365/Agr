/** Where a batch of seedlings has got to, from the seed going into a pot to the young trees
 *  going out into an orchard. */
export type NurseryStage = 'Sown' | 'Sprouted' | 'Hardening' | 'Ready' | 'PlantedOut';

export type TreeSeedling = {
  id: number;
  /** The fruit kind's name, from the same catalog the orchards use. */
  type: string;
  /** Optional label, e.g. "Gala from seed", to tell apart batches that share a type. */
  name: string;
  /** How many seedlings the batch is raising. */
  quantity: number;
  stage: NurseryStage;
  /** ISO date (YYYY-MM-DD). */
  sownDate: string;
  sproutedDate: string | null;
  hardeningDate: string | null;
  readyDate: string | null;
  plantedOutDate: string | null;
  /** Where the pots are kept — a windowsill, a frame, a greenhouse bench. */
  location: string;
  notes: string | null;
  /** The orchard this batch joined once planted out. */
  treeStockId: number | null;
  /** How many actually went outside — some of a batch never make it. */
  plantedOutQuantity: number;
};

export type TreeSeedlingInput = Omit<TreeSeedling, 'id'>;

export type PlantOutRequest = {
  treeStockId: number;
  quantity: number;
  date: string | null;
  note: string | null;
};
