export type ListingType = 'Sale' | 'Rent';
export type ListingCategory = 'Stock' | 'TreeStock' | 'Livestock' | 'Equipment' | 'TreeProduct' | 'Other';
export type ListingStatus = 'Active' | 'Completed';

export type MarketListing = {
  id: number;
  sellerId: number;
  sellerName: string;
  /** Live from the seller's current profile (not a snapshot) — see server/Models/MarketListingDto.cs. */
  sellerSurname: string;
  sellerPhoneNumber: string;
  sellerImagePath: string;
  type: ListingType;
  category: ListingCategory;
  itemType: string;
  title: string;
  description: string | null;
  price: number;
  priceUnit: string;
  quantity: number | null;
  location: string;
  imagePaths: string[];
  status: ListingStatus;
  /** A promoted listing: the server sorts these first and the card is bordered gold. Read-only
   *  here — the update endpoint deliberately ignores it, so a seller cannot promote themselves. */
  isPremium: boolean;
  /** Set once the seller has asked for promotion, so the card can say the request is in rather
   *  than offering the action again. Null until they ask. */
  premiumRequestedAt: string | null;
  createdAt: string;
};

// Fields the server stamps itself or joins live are omitted. `isPremium` is among them: the update
// endpoint deliberately does not copy it across, so sending it would be a value the server throws
// away — and a promotion a seller can award themselves is not a promotion.
export type MarketListingInput = Omit<
  MarketListing,
  | 'id'
  | 'sellerId'
  | 'sellerName'
  | 'sellerSurname'
  | 'sellerPhoneNumber'
  | 'sellerImagePath'
  | 'status'
  | 'isPremium'
  | 'premiumRequestedAt'
  | 'createdAt'
>;
