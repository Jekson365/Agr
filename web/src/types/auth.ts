export type UserRole = 'Owner' | 'Member';
export type StoragePlan = 'Free' | 'Medium' | 'Premium';

export type User = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  surname: string;
  phoneNumber: string;
  country: string;
  city: string;
  birthDate: string | null;
  imagePath: string;
  latitude: number | null;
  longitude: number | null;
  plan: StoragePlan;
  storageUsedBytes: number;
  /** Coins earned: 50 for joining, 100 for each new neighbour. */
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
};
