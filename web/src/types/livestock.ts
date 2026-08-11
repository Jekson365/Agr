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
  /** The group has been realized — it has a realization record. A mark on the group, not a
   *  deduction from it: the count stays where it is, and the herd stays whole beside its history.
   *  Owned by the server, which sets it with the realization record and clears it with the last
   *  one; sent back on an edit and ignored there. */
  isRealized: boolean;
};

export type LivestockInput = Omit<Livestock, 'id'>;
