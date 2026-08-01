import calendarIcon from '@/assets/icons/calendar.png';
import farmIcon from '@/assets/icons/farm.png';
import greenhouseIcon from '@/assets/icons/greenhouse.png';
import harvestIcon from '@/assets/icons/harvest.png';
import mapIcon from '@/assets/icons/map.png';
import marketIcon from '@/assets/icons/market.png';
import reportIcon from '@/assets/icons/report.png';
import animalsIcon from '@/assets/properties/animals.png';
import balanceIcon from '@/assets/properties/balance.png';
import equipmentIcon from '@/assets/properties/equipment.png';
import fruitsIcon from '@/assets/properties/fruits.png';
import landIcon from '@/assets/properties/land.png';
import plantsIcon from '@/assets/properties/plants.png';
import seedIcon from '@/assets/seed.png';
import type { StoragePlan } from '@/types/auth';
import {
  CALENDAR_CONFIG,
  CROP_FARMING_CONFIG,
  FRUIT_STOCK_CONFIG,
  GREENHOUSE_CONFIG,
  LIVESTOCK_CONFIG,
  MARKETPLACE_CONFIG,
} from '@/types/configuration';

export type NavItem = {
  to: string;
  labelKey: string;
  icon: string;
  /** Sub-links shown under this item in the sidebar when it's expanded. */
  children?: NavItem[];
  /** Hidden for users on the Free storage plan (mirrors farm-page.tsx). */
  restricted?: boolean;
  /** Shown only while the named configuration is switched on for this tenant. */
  requiresConfig?: string;
  /**
   * Sidebar-only: the row is a plain heading rather than a link, because a child already covers
   * `to`. The destination itself stays — the dashboard's quick-access tile still links to it, and
   * it names the group.
   */
  expandOnly?: boolean;
  /** Marks the link active only on an exact path match, so a group's own entry doesn't stay lit
   * while a sibling drill-down is open. */
  end?: boolean;
};

/** Mirrors the Quick Access grid on the mobile app's home screen (app/(tabs)/index.tsx), reusing its icon assets. */
export const QUICK_ACCESS_ITEMS: NavItem[] = [
  {
    to: '/farm',
    labelKey: 'dashboard.myFarm',
    icon: farmIcon,
    children: [
      { to: '/farm/land', labelKey: 'farm.land', icon: landIcon },
      {
        to: '/harvest',
        labelKey: 'dashboard.plantFarming',
        icon: plantsIcon,
        // The setting covers the whole group — the field's harvests, its seed and its stock.
        requiresConfig: CROP_FARMING_CONFIG,
        children: [
          { to: '/harvest', labelKey: 'dashboard.harvest', icon: harvestIcon },
          { to: '/farm/seeds', labelKey: 'seed.title', icon: seedIcon },
          { to: '/farm/stock', labelKey: 'farm.plantStock', icon: plantsIcon },
        ],
      },
      {
        // The orchard stands apart from sown crops: trees are picked, not planted each season,
        // so it gets its own inventory and harvest pair.
        to: '/farm/fruits',
        labelKey: 'farm.fruits',
        icon: fruitsIcon,
        requiresConfig: FRUIT_STOCK_CONFIG,
        children: [
          { to: '/farm/fruits', labelKey: 'fruits.trees', icon: fruitsIcon },
          { to: '/farm/fruits/harvest', labelKey: 'dashboard.harvest', icon: harvestIcon },
          // { to: '/farm/fruits/products', labelKey: 'treeProduct.title', icon: fruitsIcon },
        ],
      },
      { to: '/farm/livestock', labelKey: 'farm.livestock', icon: animalsIcon, requiresConfig: LIVESTOCK_CONFIG },
      // Crop farming bundles the three plant-side areas; its own link lands on the harvest page.
      { to: '/farm/balance', labelKey: 'farm.balance', icon: balanceIcon },
      { to: '/farm/equipment', labelKey: 'equipment.title', icon: equipmentIcon, restricted: true },
    ],
  },
  // Covered growing stands beside the farm rather than inside it, and only appears once the
  // greenhouse configuration is switched on. Its stock and harvests hang off it, the way the
  // plant-farming group gathers the field's.
  {
    to: '/farm/greenhouse',
    labelKey: 'farm.greenhouse',
    icon: greenhouseIcon,
    requiresConfig: GREENHOUSE_CONFIG,
    children: [
      { to: '/farm/greenhouse', labelKey: 'greenhouse.listTab', icon: greenhouseIcon, end: true },
      { to: '/farm/greenhouse/stock', labelKey: 'farm.plantStock', icon: plantsIcon },
      { to: '/farm/greenhouse/seeds', labelKey: 'seed.title', icon: seedIcon },
      { to: '/farm/greenhouse/harvest', labelKey: 'dashboard.harvest', icon: harvestIcon },
    ],
  },
  // Every outlined field on one map — the user's own and their neighbourhood's.
  { to: '/map', labelKey: 'map.title', icon: mapIcon },
  // { to: '/scanner', labelKey: 'dashboard.aiPlantScanner', icon: cameraIcon },
  { to: '/market', labelKey: 'dashboard.marketplace', icon: marketIcon, requiresConfig: MARKETPLACE_CONFIG },
  {
    to: '/report',
    labelKey: 'dashboard.report',
    icon: reportIcon,
    // The overview sits in the list as its own entry, so the group header is just a group.
    expandOnly: true,
    children: [
      { to: '/report', labelKey: 'report.overviewTab', icon: reportIcon, end: true },
      { to: '/report/harvest', labelKey: 'report.harvestTab', icon: harvestIcon },
      { to: '/report/production', labelKey: 'report.productionTab', icon: animalsIcon },
      { to: '/report/stock', labelKey: 'report.stockTab', icon: plantsIcon },
    ],
  },
  { to: '/calendar', labelKey: 'dashboard.calendar', icon: calendarIcon, requiresConfig: CALENDAR_CONFIG },
];

/**
 * Whether a nav entry is available to this user. The sidebar renders the list at two levels and
 * the dashboard renders it as a grid, so the gating lives here — otherwise a rule applied to
 * nested entries alone would silently let a top-level one through.
 */
export function isNavItemVisible(
  item: NavItem,
  plan: StoragePlan | undefined,
  isConfigOn: (name: string) => boolean
): boolean {
  if (item.restricted && plan === 'Free') return false;
  if (item.requiresConfig && !isConfigOn(item.requiresConfig)) return false;
  return true;
}
