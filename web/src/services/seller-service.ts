import { apiFetch } from '@/services/api-client';
import type { User } from '@/types/auth';

export type SellerRegistration = {
  sellerName: string;
  sellerPhone: string;
};

/** Registers the signed-in account as a marketplace seller, or updates what it trades under.
 *  The same account keeps buying — registering only adds the ability to list. */
export function registerSeller(registration: SellerRegistration) {
  return apiFetch<User>('/api/sellers/register', {
    method: 'POST',
    body: JSON.stringify(registration),
  });
}
