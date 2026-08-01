import { apiFetch } from '@/services/api-client';
import type { Neighbour, NeighbourTerritory, TerritoryDetails } from '@/types/neighbour';

/** Accepted neighbours, nearest first. */
export function getNeighbours() {
  return apiFetch<Neighbour[]>('/api/neighbours');
}

/** Requests still open, in both directions — the ones to answer and the ones being waited on. */
export function getNeighbourRequests() {
  return apiFetch<Neighbour[]>('/api/neighbours/requests');
}

/** The outlines to draw around your own — thin, since a map holds many at once. */
export function getNeighbourTerritories() {
  return apiFetch<NeighbourTerritory[]>('/api/neighbours/territories');
}

/** One of them in full, for when a user picks it out on the map. */
export function getTerritoryDetails(ownerId: number, farmId: number) {
  return apiFetch<TerritoryDetails>(`/api/neighbours/territories/${ownerId}/${farmId}`);
}

/** Users matching a name, surname or email. The server answers an empty list for a term under
 *  two characters rather than most of the user table. */
export function searchNeighbours(term: string) {
  return apiFetch<Neighbour[]>(`/api/neighbours/search?q=${encodeURIComponent(term)}`);
}

/** Asks someone to be neighbours; answers with where that leaves the two of you. Asking someone
 *  who already asked you accepts their request instead. */
export function sendNeighbourRequest(userId: number) {
  return apiFetch<Neighbour>(`/api/neighbours/${userId}`, { method: 'POST' });
}

export function acceptNeighbourRequest(userId: number) {
  return apiFetch<Neighbour>(`/api/neighbours/${userId}/accept`, { method: 'POST' });
}

/** Removes a neighbour, declines a request or cancels one you sent — the link goes either way. */
export function removeNeighbour(userId: number) {
  return apiFetch<void>(`/api/neighbours/${userId}`, { method: 'DELETE' });
}
