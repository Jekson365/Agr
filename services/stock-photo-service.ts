import { apiFetch, uploadImage } from '@/services/api-client';
import type { StockPhoto, StockPhotoInput } from '@/types/stock-photo';

export function uploadStockPhotoImage(uri: string): Promise<string> {
  return uploadImage(uri, '/api/stockphotos/upload-image');
}

export function getStockPhotos(stockId: number) {
  return apiFetch<StockPhoto[]>(`/api/stockphotos?stockId=${stockId}`);
}

export function createStockPhoto(input: StockPhotoInput) {
  return apiFetch<StockPhoto>('/api/stockphotos', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteStockPhoto(id: number) {
  return apiFetch<void>(`/api/stockphotos/${id}`, {
    method: 'DELETE',
  });
}
