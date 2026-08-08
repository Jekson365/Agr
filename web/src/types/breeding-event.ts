/**
 * How far a breeding event has got. Stored as these names, so the same strings appear in the
 * database — see server/Models/BreedingStatus.cs.
 */
export type BreedingStatus = 'Breeding' | 'PregnancyConfirmed' | 'Completed' | 'Failed';

/** In the order an event moves through them, which is the order the picker offers. */
export const BREEDING_STATUSES: readonly BreedingStatus[] = [
  'Breeding',
  'PregnancyConfirmed',
  'Completed',
  'Failed',
];

export type BreedingEvent = {
  id: number;
  /** The group whose breeding page this was recorded from — context only, and null once that
   *  group is gone. The pair below is what the event is about. */
  livestockId: number | null;
  /** The sire, as a LivestockDetail id. Null once the animal itself is gone. */
  maleAnimalId: number | null;
  /** The dam, under the same rule as maleAnimalId. */
  femaleAnimalId: number | null;
  /** ISO date (YYYY-MM-DD) the pairing happened — given, not stamped. Also the date of the
   *  Breeding stage, which is why that stage has no date of its own below. */
  breedingDate: string;
  comment: string | null;
  status: BreedingStatus;
  /** ISO dates stamped by the server as each stage is reached, and kept once stamped so an event
   *  that moved on still says when it passed through. Null for a stage never reached. */
  pregnancyConfirmedDate: string | null;
  completedDate: string | null;
  failedDate: string | null;
  /** How many animals this pairing has produced, over every result recorded against it. 0 until
   *  one is. Held on the event because a result can be recorded as a head count with no animals
   *  written down, and those leave nothing to count. */
  offspringCount: number;
  /** The group they joined, from the most recent result. */
  offspringLivestockId: number | null;
  createdAt: string;
};

export type BreedingEventInput = Omit<BreedingEvent, 'id' | 'createdAt'>;

/** What a pairing produced. The parents are not sent — the server takes them from the event. */
export type BreedingResultInput = {
  /** The group the offspring join. Same kind as the parents. */
  livestockId: number;
  quantity: number;
  gender: 'Male' | 'Female' | null;
  imagePath: string | null;
  /** ISO date (YYYY-MM-DD) they were born, or null when not recorded. */
  bornDate: string | null;
  /** Whether each animal also gets a record of its own. Off, they are only counted: the group's
   *  head count rises and nothing else is written, so there is nothing to carry the parentage,
   *  the gender or the photo either. */
  addIndividuals: boolean;
};
