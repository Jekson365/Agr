export type AnimalProduction = {
  id: number;
  /** Set for a single-animal record; null for a whole-livestock-group record. */
  animalId: number | null;
  /** Set for a whole-livestock-group record; null for a single-animal record. */
  livestockId: number | null;
  /** Number of animals this record covers: 1 for a single-animal record, or the group's
   * contributing count for a group record. */
  animalCount: number;
  productionTypeId: number;
  collectionDate: string;
  quantity: number;
  unitId: number;
  quality: string | null;
  pricePerUnit: number | null;
  totalPrice: number | null;
  collectedBy: string | null;
  batchNumber: string | null;
  notes: string | null;
  /** A realization: the animals this covers were slaughtered and their meat taken. Saved like any
   *  other record, but the group's count falls by animalCount and rises again if it is deleted. */
  isRealization: boolean;
  createdAt: string;
};

export type AnimalProductionInput = {
  animalId: number | null;
  livestockId: number | null;
  animalCount: number;
  productionTypeId: number;
  collectionDate: string;
  quantity: number;
  unitId: number;
  quality: string | null;
  pricePerUnit: number | null;
  totalPrice: number | null;
  collectedBy: string | null;
  batchNumber: string | null;
  notes: string | null;
  isRealization: boolean;
};
