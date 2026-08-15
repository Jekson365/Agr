export type TreeProductUnit = 'Kilogram' | 'Box' | 'Quantity';

/** A kind of produce a tree yields — a standalone catalog entry, assigned to the one tree stock
 *  that grows it. */
export type TreeProduct = {
  id: number;
  name: string;
  unit: TreeProductUnit;
};

export type TreeProductInput = Omit<TreeProduct, 'id'>;
