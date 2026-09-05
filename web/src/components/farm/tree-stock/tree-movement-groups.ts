import type { TreeStockMovement } from '@/types/tree-stock-movement';

export type MovementRow = TreeStockMovement & { balance: number };

export type MovementGroup = {
  key: string;
  month: number;
  year: number;
  net: number;
  rows: MovementRow[];
};

function monthKey(movement: TreeStockMovement): { month: number; year: number } {
  const iso = movement.date ?? movement.createdAt;
  const date = new Date(iso.length > 10 ? iso : `${iso}T00:00:00`);
  return { month: date.getMonth(), year: date.getFullYear() };
}

export function buildMovementGroups(movements: TreeStockMovement[], amount: number): MovementGroup[] {
  let running = amount;
  const rows: MovementRow[] = [];
  for (let i = movements.length - 1; i >= 0; i -= 1) {
    rows.push({ ...movements[i], balance: running });
    running -= movements[i].delta;
  }

  const groups: MovementGroup[] = [];
  for (const row of rows) {
    const { month, year } = monthKey(row);
    const last = groups[groups.length - 1];
    if (last && last.month === month && last.year === year) {
      last.net += row.delta;
      last.rows.push(row);
      continue;
    }
    groups.push({ key: `${year}-${month}`, month, year, net: row.delta, rows: [row] });
  }
  return groups;
}
