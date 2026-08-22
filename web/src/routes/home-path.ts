import type { User } from '@/types/auth';

/**
 * Where a signed-in account belongs.
 *
 * The farm starts at its land — there is no dashboard between the sign-in and the work. An account
 * without the farm software has no land to start at, so it goes to the marketplace, which for it
 * is the whole app.
 */
export function homePathFor(user: Pick<User, 'hasManagementAccess'> | null | undefined): string {
  return user?.hasManagementAccess === false ? '/market' : '/farm/land';
}
