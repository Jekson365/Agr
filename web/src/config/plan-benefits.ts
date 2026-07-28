import { ApiError } from '@/services/api-client';

/** What the server answers with when a plan cap, not the input, is what blocked a write. */
const PLAN_LIMIT_STATUS = 402;

/** True when `err` is the server refusing a write because the plan's cap was in the way. */
export function isPlanLimitError(err: unknown): err is ApiError {
  return err instanceof ApiError && err.status === PLAN_LIMIT_STATUS;
}

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
