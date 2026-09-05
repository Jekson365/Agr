import type { User } from '@/types/auth';
import { CROP_FARMING_CONFIG, LIVESTOCK_CONFIG } from '@/types/configuration';
import type { Farm } from '@/types/farm';

export type OnboardingStepKey = 'profile' | 'land' | 'stock' | 'livestock';

export type OnboardingData = {
  farms: Farm[];
  stockCount: number;
  livestockCount: number;
};

const ALL_STEPS: OnboardingStepKey[] = ['profile', 'land', 'stock', 'livestock'];

const STEP_CONFIG: Partial<Record<OnboardingStepKey, string>> = {
  stock: CROP_FARMING_CONFIG,
  livestock: LIVESTOCK_CONFIG,
};

export const ONBOARDING_STEP_LABEL_KEY: Record<OnboardingStepKey, string> = {
  profile: 'onboarding.stepProfile',
  land: 'onboarding.stepLand',
  stock: 'onboarding.stepStock',
  livestock: 'onboarding.stepLivestock',
};

export const ONBOARDING_STEP_TEXT_KEY: Record<OnboardingStepKey, string> = {
  profile: 'onboarding.stepTextProfile',
  land: 'onboarding.stepTextLand',
  stock: 'onboarding.stepTextStock',
  livestock: 'onboarding.stepTextLivestock',
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

export function isStepDone(step: OnboardingStepKey, user: User, data: OnboardingData): boolean {
  switch (step) {
    case 'profile':
      return (user.farmName ?? '').trim() !== '' && user.latitude != null && user.longitude != null;
    case 'land':
      return activeFarms(data.farms).length > 0;
    case 'stock':
      return data.stockCount > 0;
    case 'livestock':
      return data.livestockCount > 0;
  }
}

export function unfinishedSteps(
  steps: OnboardingStepKey[],
  user: User,
  data: OnboardingData
): OnboardingStepKey[] {
  return steps.filter((step) => !isStepDone(step, user, data));
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
