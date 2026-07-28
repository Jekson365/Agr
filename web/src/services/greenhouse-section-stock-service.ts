import { apiFetch } from '@/services/api-client';

/** One planting record: a stock kind planted in a section. */
export type GreenhouseSectionStock = {
  id: number;
  greenhouseSectionId: number;
  greenhouseStockId: number;
};

/** Every planting on every section of a floor, in one call — avoids a request per section. */
export function getGreenhouseSectionStockForFloor(greenhouseFloorId: number) {
  return apiFetch<GreenhouseSectionStock[]>(`/api/greenhousesections/stock?greenhouseFloorId=${greenhouseFloorId}`);
}

/** Replaces the full set of stock kinds planted in a section. */
export function setGreenhouseSectionStock(sectionId: number, stockIds: number[]) {
  return apiFetch<void>(`/api/greenhousesections/${sectionId}/stock`, {
    method: 'PUT',
    body: JSON.stringify(stockIds),
  });
}
