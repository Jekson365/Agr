import type { SeedUnit } from '@/types/seed';
import type { WineStage } from '@/types/wine';

export type AdminSignInMethod = 'Email' | 'Phone' | 'Google';

export type AdminVisit = {
  at: string;
  device: string;
  browser: string;
  os: string;
  city: string;
  countryCode: string;
  country: string;
};

export type AdminUserActivity = {
  signIn: AdminSignInMethod;
  farmCreatedAt: string | null;
  storageUsedBytes: number;
  storageLimitBytes: number | null;
  pageViews: number;
  sessions: number;
  lastVisit: AdminVisit | null;
  neighbours: number;
  sales: number;
  salesAmount: number;
};

export type AdminSeed = {
  id: number;
  type: string;
  name: string;
  amount: number;
  unit: SeedUnit;
  isDeleted: boolean;
};

export type AdminEquipment = {
  id: number;
  name: string;
  quantity: number;
  imagePath: string;
};

export type AdminWineBatch = {
  id: number;
  name: string;
  vintage: number;
  stage: WineStage;
  liters: number;
  bottles: number;
  isDeleted: boolean;
};

export type AdminRecordCounts = {
  animals: number;
  productions: number;
  purchases: number;
  calendarEvents: number;
  harvestEvents: number;
  plantScans: number;
};
