import { ApiError } from '@/services/api-client';

/**
 * What to say when the catalog refuses to delete a kind. The server answers 409 for one existing
 * rows still reference, and 403 for one of the built-ins every farm is seeded with. No picker
 * offers to delete a built-in, so the 403 only reaches a client running against a catalog it read
 * before the rule existed — worth naming plainly rather than reporting as a failed request.
 */
export function kindDeleteMessage(err: unknown, t: (key: string) => string): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return t('farm.typeBuiltIn');
    if (err.status === 409) return t('farm.typeInUse');
  }
  return t('farm.typeDeleteError');
}
