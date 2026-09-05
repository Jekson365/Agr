import { parseAmount } from '@/components/farm/stock/stock-form/stock-form';
import { ApiError } from '@/services/api-client';
import { serializeTerritory } from '@/config/territory';
import { updateLocation, uploadProfileImage } from '@/services/auth-service';
import { createFarm, uploadFarmImage } from '@/services/farm-service';
import { createLivestock } from '@/services/livestock-service';
import { ensureProductionType } from '@/services/production-type-service';
import { createStockWithSeed } from '@/services/stock-service';
import type { UpdateProfileRequest, User } from '@/types/auth';
import type { OnboardingDraft } from './onboarding-draft';
import type { OnboardingStepKey } from './onboarding-status';

export type SubmitProgress = {
  saved: Set<OnboardingStepKey>;
  farmId: number | null;
};

export function emptyProgress(existingFarmId: number | null): SubmitProgress {
  return { saved: new Set<OnboardingStepKey>(), farmId: existingFarmId };
}

export function submitErrorKey(error: unknown): string {
  return error instanceof ApiError && error.status === 409 ? 'farm.nameDuplicate' : 'onboarding.saveError';
}

type SubmitInput = {
  steps: OnboardingStepKey[];
  draft: OnboardingDraft;
  user: User;
  progress: SubmitProgress;
  updateProfile: (request: UpdateProfileRequest) => Promise<void>;
  meatTypeName: (groupName: string) => string;
};

export async function submitOnboarding(input: SubmitInput): Promise<void> {
  const { steps, progress } = input;

  for (const step of steps) {
    if (progress.saved.has(step)) continue;
    await saveStep(step, input);
    progress.saved.add(step);
  }
}

async function saveStep(step: OnboardingStepKey, input: SubmitInput): Promise<void> {
  switch (step) {
    case 'profile':
      return saveProfile(input);
    case 'land':
      return saveLand(input);
    case 'stock':
      return saveStock(input);
    case 'livestock':
      return saveLivestock(input);
  }
}

async function saveProfile({ draft, user, updateProfile }: SubmitInput): Promise<void> {
  const { farmName, iconFile, point } = draft.profile;
  const farmImagePath = iconFile ? await uploadProfileImage(iconFile) : (user.farmImagePath ?? '');
  if (point) {
    await updateLocation(point.lat, point.lng);
  }
  await updateProfile({
    name: user.name,
    surname: user.surname ?? '',
    phoneNumber: user.phoneNumber ?? '',
    country: user.country ?? '',
    city: user.city ?? '',
    birthDate: user.birthDate ? user.birthDate.slice(0, 10) : null,
    imagePath: user.imagePath ?? '',
    farmName: farmName.trim(),
    farmImagePath,
  });
}

async function saveLand({ draft, progress }: SubmitInput): Promise<void> {
  const { name, area, location, imageFile, territory } = draft.land;
  const imagePath = imageFile ? await uploadFarmImage(imageFile) : '';
  const created = await createFarm({
    name: name.trim(),
    imagePath,
    area: Math.max(0, parseFloat(area) || 0),
    location: location.trim(),
    boundary: serializeTerritory(territory),
  });
  progress.farmId = created.id;
}

async function saveStock({ draft }: SubmitInput): Promise<void> {
  const { type, name, amount, unit, seedAmount, seedUnit } = draft.stock;
  await createStockWithSeed({
    type,
    name: name.trim(),
    amount: parseAmount(amount),
    unit,
    seedAmount: parseAmount(seedAmount),
    seedUnit,
  });
}

async function saveLivestock({ draft, progress, meatTypeName }: SubmitInput): Promise<void> {
  const { name, type, count, productionTypeIds } = draft.livestock;
  const trimmed = name.trim();
  if (progress.farmId == null) {
    throw new Error('missing farm');
  }
  await createLivestock({
    type,
    count: Math.max(0, parseInt(count, 10) || 0),
    name: trimmed,
    farmId: progress.farmId,
    productionTypeId: productionTypeIds[0] ?? null,
    productionTypeIds,
    meatProductionTypeId: await ensureMeatTypeId(meatTypeName(trimmed)),
  });
}

async function ensureMeatTypeId(name: string): Promise<number | null> {
  try {
    const meatType = await ensureProductionType(name);
    return meatType.id;
  } catch {
    return null;
  }
}
