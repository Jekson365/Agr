export const TREE_REASON_OTHER = 'Other';

export const TREE_PLANTING_REASONS: string[] = [
  'Planted',
  'Purchased',
  'Replanted',
  'Nursery',
  TREE_REASON_OTHER,
];

export const TREE_REMOVAL_REASONS: string[] = [
  'Died',
  'Uprooted',
  'Disease',
  'Pest',
  'Frost',
  'Storm',
  'OldAge',
  'Sold',
  TREE_REASON_OTHER,
];

const TREE_MOVEMENT_REASON_LABEL_KEY: Record<string, string> = {
  Planted: 'treeStockHistory.reasonPlanted',
  Purchased: 'treeStockHistory.reasonPurchased',
  Replanted: 'treeStockHistory.reasonReplanted',
  Nursery: 'treeStockHistory.reasonNursery',
  Died: 'treeStockHistory.reasonDied',
  Uprooted: 'treeStockHistory.reasonUprooted',
  Disease: 'treeStockHistory.reasonDisease',
  Pest: 'treeStockHistory.reasonPest',
  Frost: 'treeStockHistory.reasonFrost',
  Storm: 'treeStockHistory.reasonStorm',
  OldAge: 'treeStockHistory.reasonOldAge',
  Sold: 'treeStockHistory.reasonSold',
  Other: 'treeStockHistory.reasonOther',
};

export function treeMovementReasonLabel(value: string, t: (key: string) => string): string {
  const key = TREE_MOVEMENT_REASON_LABEL_KEY[value];
  return key ? t(key) : value;
}
