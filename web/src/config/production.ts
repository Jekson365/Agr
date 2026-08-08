// ProductionType and Unit are reference data loaded from the API (not fixed TS unions), so these
// maps are keyed by the string `name` the server returns and fall back to that name when unknown.
export const PRODUCTION_TYPE_LABEL_KEY: Record<string, string> = {
  Milk: 'production.typeMilk',
  Egg: 'production.typeEgg',
  Wool: 'production.typeWool',
  Honey: 'production.typeHoney',
  Meat: 'production.typeMeat',
  Leather: 'production.typeLeather',
  Manure: 'production.typeManure',
  Silk: 'production.typeSilk',
};

/**
 * Outputs that are no longer offered when a group declares what it produces. They keep their
 * labels above on purpose: the rows are dropped from the seed and deleted by the
 * DropMeatAndLeatherProductionTypes migration wherever nothing references them, but a tenant
 * that already recorded one keeps it, and that history still has to read properly.
 */
export const RETIRED_PRODUCTION_TYPE_NAMES: ReadonlySet<string> = new Set(['Meat', 'Leather']);

export const UNIT_LABEL_KEY: Record<string, string> = {
  Kilogram: 'production.unitKilogram',
  Liter: 'production.unitLiter',
  Piece: 'production.unitPiece',
  Gram: 'production.unitGram',
  Dozen: 'production.unitDozen',
};
