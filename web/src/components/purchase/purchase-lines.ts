import { createEquipment } from '@/services/equipment-service';
import type { PurchaseItemInput, PurchaseItemKind } from '@/types/purchase';
import type { PurchaseTarget, PurchaseTargets } from './purchase-targets';

export const NEW_TARGET_KEY = 'new';

export type PurchaseLine = {
  id: number;
  kind: PurchaseItemKind;
  targetKey: string;
  quantity: string;
  price: string;
  /** Name of an inventory item bought before the farm held any — created on save. */
  newName?: string;
};

export function targetKey(target: PurchaseTarget): string {
  return `${target.targetId}:${target.unitId ?? ''}`;
}

export function findTarget(targets: PurchaseTargets, line: PurchaseLine): PurchaseTarget | null {
  return targets[line.kind].find((target) => targetKey(target) === line.targetKey) ?? null;
}

/**
 * A saved document's lines as form rows. A line whose target has since been removed is dropped
 * rather than carried: the server refuses to book one against a removed holding, so keeping it
 * would only fail on save — and the count of what went is reported so the form can say so.
 */
export function linesFromDocument(
  items: { kind: PurchaseItemKind; targetId: number; unitId: number | null; quantity: number; price: number }[],
  targets: PurchaseTargets
): { lines: PurchaseLine[]; dropped: number } {
  const lines: PurchaseLine[] = [];
  let dropped = 0;

  for (const item of items) {
    const key = `${item.targetId}:${item.unitId ?? ''}`;
    if (!targets[item.kind].some((target) => targetKey(target) === key)) {
      dropped += 1;
      continue;
    }
    lines.push({
      id: lines.length + 1,
      kind: item.kind,
      targetKey: key,
      quantity: String(item.quantity),
      price: String(item.price),
    });
  }

  return { lines, dropped };
}

export function newLine(id: number, kind: PurchaseItemKind, targets: PurchaseTargets): PurchaseLine {
  const first = targets[kind][0];
  const key = first ? targetKey(first) : kind === 'Equipment' ? NEW_TARGET_KEY : '';
  return { id, kind, targetKey: key, quantity: '', price: '' };
}

export function isLineReady(line: PurchaseLine, targets: PurchaseTargets): boolean {
  const quantity = parseFloat(line.quantity) || 0;
  const price = parseFloat(line.price) || 0;
  if (quantity <= 0 || price < 0) return false;
  if (line.targetKey === NEW_TARGET_KEY) return (line.newName ?? '').trim() !== '';
  return findTarget(targets, line) != null;
}

/** The rows that are complete enough to send. A row missing a target, a quantity or a price is
 *  left out, which is what tells the form it isn't ready. */
export function toItems(
  lines: PurchaseLine[],
  targets: PurchaseTargets,
  created: Map<number, number> = new Map()
): PurchaseItemInput[] {
  return lines.flatMap((line) => {
    const quantity = parseFloat(line.quantity) || 0;
    const price = parseFloat(line.price) || 0;
    if (quantity <= 0 || price < 0) return [];

    if (line.targetKey === NEW_TARGET_KEY) {
      const targetId = created.get(line.id);
      if (targetId == null) return [];
      return [{ kind: line.kind, targetId, unitId: null, quantity, price }];
    }

    const target = findTarget(targets, line);
    if (!target) return [];
    return [{ kind: line.kind, targetId: target.targetId, unitId: target.unitId, quantity, price }];
  });
}

export async function createNewTargets(lines: PurchaseLine[]): Promise<Map<number, number>> {
  const created = new Map<number, number>();
  for (const line of lines) {
    if (line.targetKey !== NEW_TARGET_KEY) continue;
    const name = (line.newName ?? '').trim();
    if (name === '') continue;
    const equipment = await createEquipment({ name, quantity: 0, imagePath: '' });
    created.set(line.id, equipment.id);
  }
  return created;
}
