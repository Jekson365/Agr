import harvestIcon from '@/assets/icons/harvest.png';
import grapeIcon from '@/assets/goods/grape.png';
import bottleIcon from '@/assets/icons/bottle-small.svg';
import qvevriIcon from '@/assets/icons/qvevri.svg';
import balanceIcon from '@/assets/properties/balance.png';
import { WINE_AREA } from '@/config/stock-areas';
import { WINE_BOTTLES_PATH, WINE_CELLAR_PATH } from '@/config/wine';
import type { NavItem } from '@/config/nav-items';
import { WINE_CONFIG } from '@/types/configuration';

export const WINE_NAV_ITEM: NavItem = {
  to: WINE_AREA.harvestPath,
  labelKey: 'wine.title',
  icon: grapeIcon,
  requiresConfig: WINE_CONFIG,
  children: [
    { to: WINE_AREA.stockPath, labelKey: WINE_AREA.titleKey, icon: grapeIcon, end: true },
    { to: WINE_AREA.harvestPath, labelKey: 'wine.harvest', icon: harvestIcon },
    {
      to: WINE_CELLAR_PATH,
      labelKey: 'wine.cellarTitle',
      icon: qvevriIcon,
      children: [{ to: WINE_BOTTLES_PATH, labelKey: 'farm.balance', icon: bottleIcon }],
    },
    { to: WINE_AREA.balancePath, labelKey: 'farm.balance', icon: balanceIcon },
  ],
};
