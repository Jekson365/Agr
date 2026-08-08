/** Where a change in a group's head count came from — see server/Models/LivestockMovement.cs. */
export type LivestockMovementSource = 'Manual' | 'Birth' | 'Gift' | 'Purchase' | 'Realization';

/** The ways a herd can grow, which are the ones offered when recording one by hand. Realization
 *  is absent on purpose: animals leave through a realization record, not through this form. */
export const LIVESTOCK_MOVEMENT_SOURCES: readonly LivestockMovementSource[] = [
  'Purchase',
  'Gift',
  'Birth',
  'Manual',
];

export type LivestockMovement = {
  id: number;
  livestockId: number;
  /** How many head this added, or removed when negative. */
  delta: number;
  source: LivestockMovementSource;
  /** ISO date (YYYY-MM-DD) it happened, which is not always the day it was recorded. */
  date: string;
  note: string | null;
  createdAt: string;
};

export type LivestockMovementInput = Omit<LivestockMovement, 'id' | 'createdAt'>;
