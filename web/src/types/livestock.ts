// An animal type is now an open set — the built-in defaults plus whatever custom LivestockKinds
// a user has added (see services/livestock-kind-service.ts) — so it's a plain string, not a union.
export type AnimalType = string;

export type Livestock = {
  id: number;
  type: AnimalType;
  count: number;
  name: string;
  farmId: number;
};

export type LivestockInput = Omit<Livestock, 'id'>;
