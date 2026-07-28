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
  createdAt: string;
};

// Fields the server stamps itself or joins live are omitted.
export type MarketListingInput = Omit<
  MarketListing,
  'id' | 'sellerId' | 'sellerName' | 'sellerSurname' | 'sellerPhoneNumber' | 'sellerImagePath' | 'status' | 'createdAt'
>;
