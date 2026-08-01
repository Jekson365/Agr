import type { SeedUnit } from '@/types/seed';
import type { Stock, StockType, StockUnit } from '@/types/stock';

/**
 * The stock form's fields. Amounts are held as strings so a half-typed number stays as typed, and
 * are parsed only on the way out — see {@link parseAmount}.
 */
export type StockFormValues = {
  type: StockType;
  name: string;
  amount: string;
  unit: StockUnit;
  /** The seed created alongside a new stock. Ignored when editing — see StockSeedFields. */
  seedAmount: string;
  seedUnit: SeedUnit;
};

/** The form as it opens: the row being edited, or blank for a new one. The type is filled in by
 * the catalog field once its list arrives, when there is nothing to preset it to. */
export function makeInitialValues(editingStock: Stock | null): StockFormValues {
  return {
    type: editingStock?.type ?? '',
    name: editingStock?.name ?? '',
    amount: editingStock ? String(editingStock.amount) : '',
    unit: editingStock?.unit ?? 'Kilogram',
    seedAmount: '',
    seedUnit: 'Kilogram',
  };
}

/** A blank or unparseable amount is nothing on hand, and stock never goes negative from here. */
export function parseAmount(value: string): number {
  return Math.max(0, parseFloat(value) || 0);
}

/** A stock is only ever as specific as its kind, so that is the one field it can't do without. */
export function isFormComplete(values: StockFormValues): boolean {
  return values.type.trim() !== '';
}
