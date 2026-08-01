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
};

export type LivestockInput = Omit<Livestock, 'id'>;
