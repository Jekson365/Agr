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
  /**
   * What these trees produce, by name. Not entered: a new orchard's product is created with the row
   * and named after its fruit, since a product belongs to the one orchard that yields it. This
   * carries an existing row's product back for display only.
   */
  produce: string;
};

/** The form as it opens: the row being edited, or blank for a new one. The type is filled in once
 * the catalog arrives, and the produce once the assigned product is read back. */
export function makeInitialValues(editingStock: TreeStock | null): TreeStockFormValues {
  return {
    type: editingStock?.type ?? '',
    name: editingStock?.name ?? '',
    amount: editingStock ? String(editingStock.amount) : '',
    // Always trees for a new entry; an older row keeps whatever it was created under.
    unit: editingStock?.unit ?? TREE_STOCK_DEFAULT_UNIT,
    produce: '',
  };
}

/** A blank or unparseable amount is nothing on hand, and a count never goes negative from here. */
export function parseAmount(value: string): number {
  return Math.max(0, parseFloat(value) || 0);
}

/** The fruit kind is the only thing asked for: the produce is named after it, not entered. */
export function isFormComplete(values: TreeStockFormValues): boolean {
  return values.type.trim() !== '';
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
