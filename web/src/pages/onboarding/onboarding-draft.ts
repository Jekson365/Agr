import { WINE_AREA } from '@/config/stock-areas';
import type { TerritoryPoint } from '@/config/territory';
import type { FarmModule, User } from '@/types/auth';
import type { SeedUnit } from '@/types/seed';
import type { StockUnit } from '@/types/stock';
import type { OnboardingStepKey } from './onboarding-status';

export type ProfileDraft = {
  farmName: string;
  point: TerritoryPoint | null;
};

export type LandDraft = {
  name: string;
  area: string;
  location: string;
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

export type FruitDraft = {
  type: string;
  name: string;
  amount: string;
};

export type OnboardingDraft = {
  profile: ProfileDraft;
  module: FarmModule | null;
  land: LandDraft;
  stock: StockDraft;
  livestock: LivestockDraft;
  fruit: FruitDraft;
  wine: StockDraft;
};

export function emptyDraft(user: User | null): OnboardingDraft {
  return {
    profile: {
      farmName: user?.farmName ?? '',
      point:
        user?.latitude != null && user?.longitude != null ? { lat: user.latitude, lng: user.longitude } : null,
    },
    module: user?.freeModule ?? null,
    land: { name: '', area: '', location: '', territory: [] },
    stock: { type: '', name: '', amount: '', unit: 'Kilogram', seedAmount: '', seedUnit: 'Kilogram' },
    livestock: { name: '', type: '', count: '', productionTypeIds: [] },
    fruit: { type: '', name: '', amount: '' },
    wine: {
      type: WINE_AREA.fixedType ?? '',
      name: '',
      amount: '',
      unit: WINE_AREA.defaultUnit,
      seedAmount: '',
      seedUnit: 'Kilogram',
    },
  };
}

export function isStepReady(step: OnboardingStepKey, draft: OnboardingDraft, hasFarm: boolean): boolean {
  switch (step) {
    case 'profile':
      return draft.profile.farmName.trim() !== '';
    case 'module':
      return draft.module !== null;
    case 'land':
      return draft.land.name.trim() !== '';
    case 'stock':
      return draft.stock.type.trim() !== '';
    case 'livestock':
      return draft.livestock.name.trim() !== '' && draft.livestock.type !== '' && hasFarm;
    case 'fruit':
      return draft.fruit.type.trim() !== '';
    case 'wine':
      return draft.wine.type.trim() !== '';
  }
}
