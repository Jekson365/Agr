// An animal type is now an open set — the built-in defaults plus whatever custom LivestockKinds
// a user has added (see services/livestock-kind-service.ts) — so it's a plain string, not a union.
export type AnimalType = string;

export type Livestock = {
  id: number;
  type: AnimalType;
  count: number;
  name: string;
  farmId: number;
  /** What the group produces — the type every one of its production records is collected under.
   *  Chosen when the group is added and settled from then on. Null only for a group recorded
   *  before the choice moved here that has collected nothing. */
  productionTypeId: number | null;
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
