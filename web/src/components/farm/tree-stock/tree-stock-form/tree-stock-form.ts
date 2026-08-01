import { TREE_STOCK_DEFAULT_UNIT } from '@/config/fruit-kinds';
import type { FruitType, TreeStock, TreeStockUnit } from '@/types/tree-stock';

/**
 * The tree stock form's fields. The amount is held as a string so a half-typed number stays as
 * typed; the unit isn't a choice — see the form — but an older row keeps whatever it was created
 * under, so it travels with the values.
 */
export type TreeStockFormValues = {
  type: FruitType;
  name: string;
  amount: string;
  unit: TreeStockUnit;
  /** The catalog product these trees yield. Required to save. */
  productId: number | null;
};

/** The form as it opens: the row being edited, or blank for a new one. The type and the product
 * are filled in once their lists arrive, when there is nothing to preset them to. */
export function makeInitialValues(editingStock: TreeStock | null): TreeStockFormValues {
  return {
    type: editingStock?.type ?? '',
    name: editingStock?.name ?? '',
    amount: editingStock ? String(editingStock.amount) : '',
    // Always trees for a new entry; an older row keeps whatever it was created under.
    unit: editingStock?.unit ?? TREE_STOCK_DEFAULT_UNIT,
    productId: editingStock?.treeProductId ?? null,
  };
}

/** A blank or unparseable amount is nothing on hand, and a count never goes negative from here. */
export function parseAmount(value: string): number {
  return Math.max(0, parseFloat(value) || 0);
}

/** Trees must declare what they produce, so a product is required alongside the fruit kind. */
export function isFormComplete(values: TreeStockFormValues): boolean {
  return values.type.trim() !== '' && values.productId != null;
}

/** The products already spoken for by rows other than the one being edited. */
export function productsOfOtherRows(rows: TreeStock[], editing: TreeStock | null): Set<number> {
  const ids = rows
    .filter((row) => row.id !== editing?.id && row.treeProductId != null)
    .map((row) => row.treeProductId as number);
  return new Set(ids);
}

/**
 * Whether another row already carries this label. It is what tells two stocks of the same fruit
 * apart, so it can't be shared — but a blank one isn't a label. Those rows show their fruit's name
 * instead, and any number of them may exist.
 */
export function isNameTaken(name: string, rows: TreeStock[], editing: TreeStock | null): boolean {
  const trimmed = name.trim();
  if (trimmed === '') {
    return false;
  }
  return rows.some((row) => row.id !== editing?.id && row.name.trim().toLowerCase() === trimmed.toLowerCase());
}
