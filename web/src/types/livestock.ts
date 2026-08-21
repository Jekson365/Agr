// An animal type is now an open set — the built-in defaults plus whatever custom LivestockKinds
// a user has added (see services/livestock-kind-service.ts) — so it's a plain string, not a union.
export type AnimalType = string;

export type Livestock = {
  id: number;
  type: AnimalType;
  count: number;
  name: string;
  farmId: number;
  /** The first of {@link productionTypeIds}, kept for older clients that know only one output.
   *  Null for a group that declares none. */
  productionTypeId: number | null;
  /** Everything the group produces — every record it collects is filed under one of these. An
   *  output can be added at any time; one the group has already collected under cannot be dropped
   *  (the server answers 409). Empty for a group that declares none. */
  productionTypeIds: number[];
  /** This group's meat — the type a realization of it is recorded under, separate from what it
   *  produces day to day. Created with the group and named after its animal, so rabbit meat and
   *  cow meat are not the same output. Null for a group recorded before this existed. */
  meatProductionTypeId: number | null;
  // No realized-or-not here: realization is one animal's, and which of a group's animals have been
  // realized is told by its records — see AnimalProduction.isRealization.
  /** Whether the group has been removed from the livestock page. Removing marks rather than drops,
   *  so everything collected from it still reads back; it is left out of the list and of the
   *  balance until the removed holdings are asked for. */
  isDeleted: boolean;
};

export type LivestockInput = Omit<Livestock, 'id' | 'isDeleted'>;
