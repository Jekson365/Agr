import type { ListingCategory, ListingSourceKind } from '@/types/market-listing';

export type MarketOrderStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

export type MarketOrderFulfillment = 'Ordered' | 'Sold';

export type MarketSale = {
  id: number;
  listingId: number;
  itemTitle: string;
  itemType: string;
  itemCategory: ListingCategory;
  priceUnit: string;
  sourceKind: ListingSourceKind | null;
  sourceId: number | null;
  sourceUnitId: number | null;
  buyerName: string;
  buyerSurname: string;
  buyerPhone: string;
  buyerAddress: string;
  buyerCity: string;
  buyerVillage: string;
  buyerFacebookUrl: string | null;
  quantity: number;
  amount: number;
  currency: string;
  sellerAmount: number;
  paymentStatus: MarketOrderStatus;
  fulfillment: MarketOrderFulfillment;
  stockApplied: boolean;
  createdAt: string;
  paidAt: string | null;
};

export type SalesPeriod = 'Week' | 'Month' | 'Year' | 'Custom';

export type SalesBucketUnit = 'Day' | 'Week' | 'Month' | 'Year';

export type MarketSalesBucket = {
  start: string;
  total: number;
  count: number;
};

export type MarketSalesSummary = {
  unit: SalesBucketUnit;
  from: string;
  to: string;
  buckets: MarketSalesBucket[];
};
