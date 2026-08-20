import { apiFetch } from '@/services/api-client';
import type { AdminUser, PremiumRequest } from '@/types/admin';

/**
 * Whether the signed-in account may open the manager page.
 *
 * Asked of the server rather than read from the stored session: that session is a week old at worst
 * and editable at best. Every endpoint below checks again anyway — this one exists so the guard can
 * redirect quickly instead of waiting for a list request to be refused.
 */
export function getAdminStatus(): Promise<{ isSuperAdmin: boolean }> {
  return apiFetch<{ isSuperAdmin: boolean }>('/api/admin/me');
}

export function getAdminUsers(): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>('/api/admin/users');
}

/** Pending requests by default; `includeHandled` also returns the ones already granted. */
export function getPremiumRequests(includeHandled = false): Promise<PremiumRequest[]> {
  return apiFetch<PremiumRequest[]>(`/api/admin/premium-requests${includeHandled ? '?includeHandled=true' : ''}`);
}

export function approvePremiumRequest(listingId: number): Promise<PremiumRequest> {
  return apiFetch<PremiumRequest>(`/api/admin/premium-requests/${listingId}/approve`, { method: 'POST' });
}

/** Turns a request down, or takes a granted promotion back. Clears the request either way, so the
 *  seller is free to ask again after changing the listing. */
export function rejectPremiumRequest(listingId: number): Promise<void> {
  return apiFetch<void>(`/api/admin/premium-requests/${listingId}/reject`, { method: 'POST' });
}

/** The seller's own side: asks for a listing of theirs to be promoted. */
export function requestPremium(listingId: number): Promise<void> {
  return apiFetch<void>(`/api/marketlistings/${listingId}/request-premium`, { method: 'POST' });
}
