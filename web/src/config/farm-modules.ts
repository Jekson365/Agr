import grapeIcon from '@/assets/goods/grape.png';
import animalsIcon from '@/assets/properties/animals.png';
import fruitsIcon from '@/assets/properties/fruits.png';
import plantsIcon from '@/assets/properties/plants.png';
import type { FarmModule, User } from '@/types/auth';
import { CROP_FARMING_CONFIG, FRUIT_STOCK_CONFIG, LIVESTOCK_CONFIG, WINE_CONFIG } from '@/types/configuration';

export type FarmModuleInfo = {
  module: FarmModule;
  labelKey: string;
  textKey: string;
  icon: string;
  config: string;
};

export const FARM_MODULES: FarmModuleInfo[] = [
  {
    module: 'Crop',
    labelKey: 'dashboard.plantFarming',
    textKey: 'onboarding.moduleTextCrop',
    icon: plantsIcon,
    config: CROP_FARMING_CONFIG,
  },
  {
    module: 'Livestock',
    labelKey: 'farm.livestock',
    textKey: 'onboarding.moduleTextLivestock',
    icon: animalsIcon,
    config: LIVESTOCK_CONFIG,
  },
  {
    module: 'Fruit',
    labelKey: 'farm.fruits',
    textKey: 'onboarding.moduleTextFruit',
    icon: fruitsIcon,
    config: FRUIT_STOCK_CONFIG,
  },
  {
    module: 'Wine',
    labelKey: 'wine.title',
    textKey: 'onboarding.moduleTextWine',
    icon: grapeIcon,
    config: WINE_CONFIG,
  },
];

type ModuleUser = Pick<User, 'allowedModules'> | null | undefined;

export function moduleInfo(module: FarmModule): FarmModuleInfo {
  return FARM_MODULES.find((entry) => entry.module === module) ?? FARM_MODULES[0];
}

export function isModuleAllowed(user: ModuleUser, module: FarmModule): boolean {
  return user?.allowedModules?.includes(module) ?? true;
}

export function lockedModule(user: ModuleUser, configName: string | undefined): FarmModule | null {
  const module = FARM_MODULES.find((entry) => entry.config === configName)?.module ?? null;
  return module !== null && !isModuleAllowed(user, module) ? module : null;
}
