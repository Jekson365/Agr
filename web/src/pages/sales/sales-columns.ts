export type SalesColumnId =
  | 'date'
  | 'buyer'
  | 'phone'
  | 'city'
  | 'village'
  | 'address'
  | 'item'
  | 'amount'
  | 'quantity'
  | 'status'
  | 'social';

export type SalesColumn = {
  id: SalesColumnId;
  labelKey: string;
  /** Right-aligned, like the two money/count columns. */
  numeric?: boolean;
  /** Cannot be switched off: the status cell carries the row's own action button, and hiding it
   *  would leave no way to mark a sale sold or delete a manual one. */
  locked?: boolean;
};

export const SALES_COLUMNS: SalesColumn[] = [
  { id: 'date', labelKey: 'sales.colDate' },
  { id: 'buyer', labelKey: 'sales.colBuyer' },
  { id: 'phone', labelKey: 'sales.colPhone' },
  { id: 'city', labelKey: 'sales.colCity' },
  { id: 'village', labelKey: 'sales.colVillage' },
  { id: 'address', labelKey: 'sales.colAddress' },
  { id: 'item', labelKey: 'sales.colItem' },
  { id: 'amount', labelKey: 'sales.colAmount', numeric: true },
  { id: 'quantity', labelKey: 'sales.colQuantity', numeric: true },
  { id: 'status', labelKey: 'sales.colStatus', locked: true },
  { id: 'social', labelKey: 'sales.colSocial' },
];

const STORAGE_KEY = 'farm.sales.columns';

/**
 * What is stored is the *hidden* set, not the visible one — the same choice the sidebar makes for
 * its collapsed groups. A column added to the table later is then shown by default rather than
 * missing for everyone who ever opened this page.
 */
export function loadHiddenColumns(): SalesColumnId[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const stored = JSON.parse(raw);
    if (!Array.isArray(stored)) return [];
    const known = new Set(SALES_COLUMNS.filter((column) => !column.locked).map((column) => column.id));
    return stored.filter((id): id is SalesColumnId => typeof id === 'string' && known.has(id as SalesColumnId));
  } catch {
    return [];
  }
}

export function saveHiddenColumns(hidden: SalesColumnId[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hidden));
  } catch {
    // A browser refusing storage (private mode, blocked site data) still gets a working table —
    // the choice just lasts as long as the page does.
  }
}
