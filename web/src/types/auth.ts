export type UserRole = 'Owner' | 'Member';
export type StoragePlan = 'Free' | 'Medium' | 'Premium';
export type FarmModule = 'Crop' | 'Livestock' | 'Fruit';

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  surname: string;
  phoneNumber: string;
  /** True once an SMS code proved the number. */
  phoneVerified: boolean;
  signsInWithPhone: boolean;
  country: string;
  city: string;
  birthDate: string | null;
  imagePath: string;
  farmName: string;
  farmImagePath: string;
  /** Whether this account may open the farm management software. False for an account registered
   *  from the marketplace, which is a shop rather than a farm. */
  hasManagementAccess: boolean;
  /** Whether this account has registered to sell. Buying needs no registration — a seller both
   *  lists and orders, from the one account. */
  isSeller: boolean;
  /** What the seller trades under, stamped onto their listings. */
  sellerName: string;
  sellerPhone: string;
  latitude: number | null;
  longitude: number | null;
  plan: StoragePlan;
  storageUsedBytes: number;
  /** Coins earned: 50 for joining, 100 for each new neighbour, 10 for each day you sign in. */
  coins: number;
  /** Byte quota for `plan`, or null when unlimited (Premium). */
  storageLimitBytes: number | null;
  /** The rest of what `plan` allows — null counts mean unlimited. */
  maxLand: number | null;
  maxLivestockKinds: number | null;
  maxStockKinds: number | null;
  maxFruitKinds: number | null;
  balanceAllowed: boolean;
  equipmentAllowed: boolean;
  freeModule?: FarmModule | null;
  allowedModules?: FarmModule[];
  needsModuleChoice?: boolean;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

/** The answer to claiming the daily sign-in bonus. */
export type DailyBonusResponse = {
  /** True only on the day's first claim; false means today's was already taken. */
  granted: boolean;
  /** What was just paid, or 0 when nothing was. */
  amount: number;
  /** The user as they now stand, balance included. */
  user: User;
};

export type PhoneRegisterRequest = {
  name: string;
  phoneNumber: string;
  password: string;
};

export type PhoneLoginRequest = {
  phoneNumber: string;
  password: string;
};

export type GoogleAuthRequest = {
  /** The Google-issued ID token (JWT) obtained from Google Identity Services. */
  idToken: string;
};

export type UpdateProfileRequest = {
  name: string;
  surname: string;
  phoneNumber: string;
  country: string;
  city: string;
  birthDate: string | null;
  imagePath: string;
  farmName: string;
  farmImagePath: string;
};
