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

/**
 * The name to give a group's meat when it is created — the group's own name and the word for
 * meat: "ჩემი კურდღლები ხორცი", "Rabbit shed meat".
 *
 * Named after the group rather than its animal, so each group has a meat of its own — two rabbit
 * herds kept apart on the farm stay apart on the balances and in the marketplace. Group names are
 * unique, so these names are too.
 *
 * Written in the creator's own language and stored that way, so unlike the built-in types above
 * it is never translated on the way out; a farm working in two languages sees whichever language
 * the group was added in. Which is also why a group points at its meat by id rather than looking
 * it up by name — see Livestock.meatProductionTypeId — and why renaming a group leaves its meat
 * under the name it was created with.
 */
export function meatProductionTypeName(groupName: string, t: (key: string, vars?: Record<string, string | number>) => string): string {
  return t('production.meatOf', { name: groupName.trim() });
}

export const UNIT_LABEL_KEY: Record<string, string> = {
  Kilogram: 'production.unitKilogram',
  Liter: 'production.unitLiter',
  Piece: 'production.unitPiece',
  Gram: 'production.unitGram',
  Dozen: 'production.unitDozen',
};
