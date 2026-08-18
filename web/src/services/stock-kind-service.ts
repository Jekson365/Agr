import { apiFetch, uploadImage } from '@/services/api-client';
import type { StockKind, StockKindInput } from '@/types/stock-kind';

export function getStockKinds() {
  return apiFetch<StockKind[]>('/api/stockkinds');
}

export function createStockKind(kind: StockKindInput) {
  return apiFetch<StockKind>('/api/stockkinds', {
    method: 'POST',
    body: JSON.stringify(kind),
  });
}

/** Fails with 409 when stock or seed rows still reference the kind. */
export function deleteStockKind(id: number) {
  return apiFetch<void>(`/api/stockkinds/${id}`, {
    method: 'DELETE',
  });
}

/** The artwork for a kind about to be added. Uploaded first, then passed as `imagePath` on the
 *  create — the row does not exist yet when the picture is chosen. */
export function uploadStockKindImage(file: File): Promise<string> {
  return uploadImage(file, '/api/stockkinds/upload-image');
}
