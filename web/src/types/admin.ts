import type { ListingCategory, ListingStatus, ListingType } from '@/types/market-listing';
import type { StoragePlan } from '@/types/auth';
import type { HarvestKind, HarvestStatus } from '@/types/harvest';

/**
 * A registered account, as the manager page sees it. Narrower than the server's `User` on purpose —
 * the password hash, the tenant database name and the exact coordinates are not part of a list of
 * who has signed up, and the DTO behind this leaves all three out.
 */
export type AdminUser = {
  id: number;
  name: string;
  surname: string;
  email: string;
  phoneNumber: string;
  phoneVerified: boolean;
  city: string;
  country: string;
  imagePath: string;
  plan: StoragePlan;
  coins: number;
  isSuperAdmin: boolean;
  /** Whether this account may open the farm software. A marketplace registration starts without
   *  it; the manager page is where it is granted. */
  hasManagementAccess: boolean;
  isSeller: boolean;
  createdAt: string;
  /** How many listings this account has on the market. */
  listingCount: number;
};

/** A listing whose seller has asked for it to be promoted. */
export type PremiumRequest = {
  listingId: number;
  title: string;
  itemType: string;
  category: ListingCategory;
  type: ListingType;
  price: number;
  priceUnit: string;
  location: string;
  imagePaths: string[];
  status: ListingStatus;
  sellerId: number;
  sellerName: string;
  sellerEmail: string;
  requestedAt: string;
  isPremium: boolean;
  grantedAt: string | null;
};

export type TenantDatabaseStatus = 'Ready' | 'Missing' | 'Outdated';

export type AdminPlot = {
  id: number;
  farmId: number;
  area: number;
  crop: string;
};

export type AdminFarm = {
  id: number;
  name: string;
  imagePath: string;
  area: number;
  location: string;
  isRemoved: boolean;
  plots: AdminPlot[];
};

export type AdminStock = {
  id: number;
  type: string;
  name: string;
  amount: number;
  unit: string;
  isDeleted: boolean;
};

export type AdminLivestock = {
  id: number;
  type: string;
  name: string;
  count: number;
  farmName: string;
  isDeleted: boolean;
};

export type AdminTreeStock = {
  id: number;
  type: string;
  name: string;
  amount: number;
  unit: string;
  farmName: string;
  isDeleted: boolean;
};

export type AdminUserOverview = {
  user: AdminUser;
  database: TenantDatabaseStatus;
  farms: AdminFarm[];
  stocks: AdminStock[];
  livestock: AdminLivestock[];
  treeStocks: AdminTreeStock[];
  harvests: AdminHarvest[];
};

export type AdminHarvestYield = {
  source: 'stock' | 'tree' | 'product';
  type: string;
  name: string;
  amount: number;
  unit: string;
};

export type AdminHarvest = {
  id: number;
  title: string;
  kind: HarvestKind;
  status: HarvestStatus;
  date: string;
  expectedHarvestDate: string | null;
  farmName: string;
  revenue: number | null;
  cost: number;
  yields: AdminHarvestYield[];
};
