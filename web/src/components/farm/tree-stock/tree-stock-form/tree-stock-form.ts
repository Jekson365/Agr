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
   * What these trees produce, by name. Required. Not a pick from the catalog: a product belongs to
   * the one orchard that yields it, so every entry already in the catalog is another orchard's and
   * listing them would only offer choices that can't be taken. Typing here names this orchard's own
   * — created with the row, and renamed in place afterwards.
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

/**
 * Trees must declare what they produce, so a name for it is required alongside the fruit kind — on
 * a new row. An existing one only shows its produce back rather than taking a new one, and a row
 * recorded before produce was asked for has none to show, so there is nothing there to require.
 */
export function isFormComplete(values: TreeStockFormValues, isEditing: boolean): boolean {
  return values.type.trim() !== '' && (isEditing || values.produce.trim() !== '');
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
