import type { PurchaseItemInput, PurchaseItemKind } from '@/types/purchase';
import type { PurchaseTarget, PurchaseTargets } from './purchase-targets';

export type PurchaseLine = {
  id: number;
  kind: PurchaseItemKind;
  targetKey: string;
  quantity: string;
  price: string;
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
  return { id, kind, targetKey: targetKey(targets[kind][0]), quantity: '', price: '' };
}

/** The rows that are complete enough to send. A row missing a target, a quantity or a price is
 *  left out, which is what tells the form it isn't ready. */
export function toItems(lines: PurchaseLine[], targets: PurchaseTargets): PurchaseItemInput[] {
  return lines.flatMap((line) => {
    const target = findTarget(targets, line);
    const quantity = parseFloat(line.quantity) || 0;
    const price = parseFloat(line.price) || 0;
    if (!target || quantity <= 0 || price < 0) return [];
    return [{ kind: line.kind, targetId: target.targetId, unitId: target.unitId, quantity, price }];
  });
}
