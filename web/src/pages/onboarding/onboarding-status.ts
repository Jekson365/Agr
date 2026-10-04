import type { FarmModule, User } from '@/types/auth';
import { CROP_FARMING_CONFIG, FRUIT_STOCK_CONFIG, LIVESTOCK_CONFIG, WINE_CONFIG } from '@/types/configuration';
import type { Farm } from '@/types/farm';

export type OnboardingStepKey = 'profile' | 'module' | 'land' | 'stock' | 'livestock' | 'fruit' | 'wine';

export type OnboardingData = {
  farms: Farm[];
  stockCount: number;
  livestockCount: number;
  fruitCount: number;
  wineCount: number;
};

const ALL_STEPS: OnboardingStepKey[] = ['profile', 'module', 'land', 'stock', 'livestock', 'fruit', 'wine'];

const STEP_CONFIG: Partial<Record<OnboardingStepKey, string>> = {
  stock: CROP_FARMING_CONFIG,
  livestock: LIVESTOCK_CONFIG,
  fruit: FRUIT_STOCK_CONFIG,
  wine: WINE_CONFIG,
};

const STEP_MODULE: Partial<Record<OnboardingStepKey, FarmModule>> = {
  stock: 'Crop',
  livestock: 'Livestock',
  fruit: 'Fruit',
  wine: 'Wine',
};

const UNCHOSEN_MODULE_STEPS: OnboardingStepKey[] = ['stock', 'livestock'];

export const ONBOARDING_STEP_LABEL_KEY: Record<OnboardingStepKey, string> = {
  profile: 'onboarding.stepProfile',
  module: 'onboarding.stepModule',
  land: 'onboarding.stepLand',
  stock: 'onboarding.stepStock',
  livestock: 'onboarding.stepLivestock',
  fruit: 'onboarding.stepFruit',
  wine: 'onboarding.stepWine',
};

export const ONBOARDING_STEP_TEXT_KEY: Record<OnboardingStepKey, string> = {
  profile: 'onboarding.stepTextProfile',
  module: 'onboarding.stepTextModule',
  land: 'onboarding.stepTextLand',
  stock: 'onboarding.stepTextStock',
  livestock: 'onboarding.stepTextLivestock',
  fruit: 'onboarding.stepTextFruit',
  wine: 'onboarding.stepTextWine',
};

export function requiredSteps(isOn: (name: string) => boolean): OnboardingStepKey[] {
  return ALL_STEPS.filter((step) => {
    const name = STEP_CONFIG[step];
    return name === undefined || isOn(name);
  });
}

export function activeFarms(farms: Farm[]): Farm[] {
  return farms.filter((farm) => !farm.isRemoved);
}

export function isStepOpen(step: OnboardingStepKey, user: User, chosen: FarmModule | null): boolean {
  if (step === 'module') {
    return !!user.needsModuleChoice || user.freeModule != null;
  }
  const module = STEP_MODULE[step];
  if (module === undefined) {
    return true;
  }
  const picked = user.freeModule ?? chosen;
  if (picked != null) {
    return picked === module;
  }
  return !user.needsModuleChoice && UNCHOSEN_MODULE_STEPS.includes(step);
}

export function isStepDone(step: OnboardingStepKey, user: User, data: OnboardingData): boolean {
  switch (step) {
    case 'profile':
      return (user.farmName ?? '').trim() !== '';
    case 'module':
      return !user.needsModuleChoice;
    case 'land':
      return activeFarms(data.farms).length > 0;
    case 'stock':
      return data.stockCount > 0;
    case 'livestock':
      return data.livestockCount > 0;
    case 'fruit':
      return data.fruitCount > 0;
    case 'wine':
      return data.wineCount > 0;
  }
}

export function unfinishedSteps(
  steps: OnboardingStepKey[],
  user: User,
  data: OnboardingData
): OnboardingStepKey[] {
  return steps.filter(
    (step) => !isStepDone(step, user, data) && (!!user.needsModuleChoice || isStepOpen(step, user, null))
  );
}

const STORAGE_KEY = 'farm.onboarding.done';

function readDoneIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === 'number') : [];
  } catch {
    return [];
  }
}

export function isOnboardingDoneMarked(userId: number): boolean {
  return readDoneIds().includes(userId);
}

export function markOnboardingDone(userId: number): void {
  try {
    const ids = readDoneIds();
    if (!ids.includes(userId)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, userId]));
    }
  } catch {
    return;
  }
}
