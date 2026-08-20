import type { ListingCategory, ListingStatus, ListingType } from '@/types/market-listing';
import type { StoragePlan } from '@/types/auth';

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
