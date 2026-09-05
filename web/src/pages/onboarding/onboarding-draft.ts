import type { TerritoryPoint } from '@/config/territory';
import type { User } from '@/types/auth';
import type { SeedUnit } from '@/types/seed';
import type { StockUnit } from '@/types/stock';
import type { OnboardingStepKey } from './onboarding-status';

export type ProfileDraft = {
  farmName: string;
  iconFile: File | null;
  iconPreview: string | null;
  point: TerritoryPoint | null;
};

export type LandDraft = {
  name: string;
  area: string;
  location: string;
  imageFile: File | null;
  imagePreview: string | null;
  territory: TerritoryPoint[];
};

export type StockDraft = {
  type: string;
  name: string;
  amount: string;
  unit: StockUnit;
  seedAmount: string;
  seedUnit: SeedUnit;
};

export type LivestockDraft = {
  name: string;
  type: string;
  count: string;
  productionTypeIds: number[];
};

export type OnboardingDraft = {
  profile: ProfileDraft;
  land: LandDraft;
  stock: StockDraft;
  livestock: LivestockDraft;
};

export function emptyDraft(user: User | null): OnboardingDraft {
  return {
    profile: {
      farmName: user?.farmName ?? '',
      iconFile: null,
      iconPreview: null,
      point:
        user?.latitude != null && user?.longitude != null ? { lat: user.latitude, lng: user.longitude } : null,
    },
    land: { name: '', area: '', location: '', imageFile: null, imagePreview: null, territory: [] },
    stock: { type: '', name: '', amount: '', unit: 'Kilogram', seedAmount: '', seedUnit: 'Kilogram' },
    livestock: { name: '', type: '', count: '', productionTypeIds: [] },
  };
}

export function isStepReady(step: OnboardingStepKey, draft: OnboardingDraft, hasFarm: boolean): boolean {
  switch (step) {
    case 'profile':
      return draft.profile.farmName.trim() !== '' && draft.profile.point !== null;
    case 'land':
      return draft.land.name.trim() !== '';
    case 'stock':
      return draft.stock.type.trim() !== '';
    case 'livestock':
      return draft.livestock.name.trim() !== '' && draft.livestock.type !== '' && hasFarm;
  }
}
