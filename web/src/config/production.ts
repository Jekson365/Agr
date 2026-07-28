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

export const UNIT_LABEL_KEY: Record<string, string> = {
  Kilogram: 'production.unitKilogram',
  Liter: 'production.unitLiter',
  Piece: 'production.unitPiece',
  Gram: 'production.unitGram',
  Dozen: 'production.unitDozen',
};
