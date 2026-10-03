import { parseAmount } from '@/components/farm/stock/stock-form/stock-form';
import { TREE_PRODUCT_DEFAULT_UNIT } from '@/config/fruit-kinds';
import { ApiError } from '@/services/api-client';
import { serializeTerritory } from '@/config/territory';
import { chooseFreeModule, createFarmDatabase, updateLocation } from '@/services/auth-service';
import { createFarm } from '@/services/farm-service';
import { createLivestock } from '@/services/livestock-service';
import { ensureProductionType } from '@/services/production-type-service';
import { createStockWithSeed } from '@/services/stock-service';
import { createTreeProduct, deleteTreeProduct } from '@/services/tree-product-service';
import { createTreeStock } from '@/services/tree-stock-service';
import type { UpdateProfileRequest, User } from '@/types/auth';
import type { OnboardingDraft } from './onboarding-draft';
import type { OnboardingStepKey } from './onboarding-status';

export type SubmitProgress = {
  saved: Set<OnboardingStepKey>;
  farmId: number | null;
  databaseReady: boolean;
};

export function emptyProgress(existingFarmId: number | null): SubmitProgress {
  return { saved: new Set<OnboardingStepKey>(), farmId: existingFarmId, databaseReady: false };
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
  refreshUser: () => Promise<void>;
  meatTypeName: (groupName: string) => string;
  fruitProductName: (type: string) => string;
};

export async function submitOnboarding(input: SubmitInput): Promise<void> {
  const { steps, progress } = input;

  if (!progress.databaseReady) {
    await createFarmDatabase();
    progress.databaseReady = true;
  }

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
    case 'module':
      return saveModule(input);
    case 'land':
      return saveLand(input);
    case 'stock':
      return saveStock(input);
    case 'livestock':
      return saveLivestock(input);
    case 'fruit':
      return saveFruit(input);
  }
}

async function saveModule({ draft, refreshUser }: SubmitInput): Promise<void> {
  if (draft.module === null) return;
  await chooseFreeModule(draft.module);
  await refreshUser();
}

async function saveFruit({ draft, fruitProductName }: SubmitInput): Promise<void> {
  const { type, name, amount } = draft.fruit;
  const product = await createTreeProduct({ name: fruitProductName(type), unit: TREE_PRODUCT_DEFAULT_UNIT });
  try {
    await createTreeStock({
      type,
      name: name.trim(),
      amount: parseAmount(amount),
      unit: 'Plant',
      landPlotId: null,
      treeProductId: product.id,
    });
  } catch (err) {
    await deleteTreeProduct(product.id).catch(() => {});
    throw err;
  }
}

async function saveProfile({ draft, user, updateProfile }: SubmitInput): Promise<void> {
  const { farmName, point } = draft.profile;
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
    farmImagePath: user.farmImagePath ?? '',
  });
}

async function saveLand({ draft, progress }: SubmitInput): Promise<void> {
  const { name, area, location, territory } = draft.land;
  const created = await createFarm({
    name: name.trim(),
    imagePath: '',
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
