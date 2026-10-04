import harvestIcon from '@/assets/icons/harvest.png';
import grapeIcon from '@/assets/goods/grape.png';
import balanceIcon from '@/assets/properties/balance.png';
import { WINE_AREA } from '@/config/stock-areas';
import type { NavItem } from '@/config/nav-items';
import { WINE_CONFIG } from '@/types/configuration';

export const WINE_NAV_ITEM: NavItem = {
  to: WINE_AREA.harvestPath,
  labelKey: 'wine.title',
  icon: grapeIcon,
  requiresConfig: WINE_CONFIG,
  children: [
    { to: WINE_AREA.stockPath, labelKey: WINE_AREA.titleKey, icon: grapeIcon, end: true },
    { to: WINE_AREA.harvestPath, labelKey: 'dashboard.harvest', icon: harvestIcon },
    { to: WINE_AREA.balancePath, labelKey: 'farm.balance', icon: balanceIcon },
  ],
};
