import type { StoragePlan } from '@/types/auth';

export type PlanBenefit = {
  plan: StoragePlan;
  /** null means unlimited. */
  storageBytes: number | null;
  land: number | null;
  livestock: number | null;
  stock: number | null;
  fruit: number | null;
  balance: boolean;
  equipment: boolean;
};

/** Mirrors server/Models/StoragePlan.cs + server/Models/PlanLimits.cs, for display only. */
export const PLAN_BENEFITS: PlanBenefit[] = [
  {
    plan: 'Free',
    storageBytes: 50 * 1024 * 1024,
    land: 1,
    livestock: 3,
    stock: 3,
    fruit: 3,
    balance: false,
    equipment: false,
  },
  {
    plan: 'Medium',
    storageBytes: 300 * 1024 * 1024,
    land: 3,
    livestock: 10,
    stock: 10,
    fruit: 10,
    balance: true,
    equipment: true,
  },
  {
    plan: 'Premium',
    storageBytes: null,
    land: null,
    livestock: null,
    stock: null,
    fruit: null,
    balance: true,
    equipment: true,
  },
];

/** True once `currentCount` has reached a plan's cap; a null cap means unlimited. */
export function isAtLimit(max: number | null | undefined, currentCount: number): boolean {
  return max != null && currentCount >= max;
}

/**
 * True once `currentCount` has passed the cap — the state a plan downgrade leaves behind, and the
 * only one where the server also refuses edits (see FarmsController). Being exactly full is not
 * over: those rows stay editable.
 */
export function isOverLimit(max: number | null | undefined, currentCount: number): boolean {
  return max != null && currentCount > max;
}
