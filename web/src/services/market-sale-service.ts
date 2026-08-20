import { apiFetch } from '@/services/api-client';
import type {
  MarketOrderFulfillment,
  MarketSale,
  MarketSalesSummary,
  SalesPeriod,
} from '@/types/market-sale';

export function getMarketSales(from?: string | null, to?: string | null): Promise<MarketSale[]> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  return apiFetch<MarketSale[]>(`/api/marketsales${query ? `?${query}` : ''}`);
}

export function getMarketSalesSummary(
  period: SalesPeriod,
  from?: string | null,
  to?: string | null
): Promise<MarketSalesSummary> {
  const params = new URLSearchParams({ period });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return apiFetch<MarketSalesSummary>(`/api/marketsales/summary?${params.toString()}`);
}

export function setMarketSaleFulfillment(id: number, fulfillment: MarketOrderFulfillment): Promise<MarketSale> {
  return apiFetch<MarketSale>(`/api/marketsales/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ fulfillment }),
  });
}
