import calendarIcon from '@/assets/icons/calendar.png';
import farmIcon from '@/assets/icons/farm.png';
import greenhouseIcon from '@/assets/icons/greenhouse.png';
import harvestIcon from '@/assets/icons/harvest.png';
import mapIcon from '@/assets/icons/map.png';
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
  /** Shown only to the account with this email — see {@link CATALOG_ADMIN_EMAIL}. */
  requiresEmail?: string;
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

/**
 * The one account the type catalogs are offered to.
 *
 * A convenience gate on the entry point, **not a permission**: every signed-in user can already
 * add and remove kinds from the stock, fruit and livestock forms, and the API behind this page is
 * open to all of them. It keeps a page that is only useful to one person out of everyone else's
 * sidebar — nothing more. Restricting the capability itself would take a server-side check.
 */
export const CATALOG_ADMIN_EMAIL = 'jeko.erg@gmail.com';

/** Mirrors the Quick Access grid on the mobile app's home screen (app/(tabs)/index.tsx), reusing its icon assets. */
export const QUICK_ACCESS_ITEMS: NavItem[] = [
  {
    // Land is where the farm starts, so the group's own row goes straight there rather than to the
    // /farm hub — whose tiles only repeat the children listed below it. The hub itself stays put:
    // every area page still links back to it.
    to: '/farm/land',
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
          // `end` so the stock link doesn't stay lit while its own balance is open below it.
          { to: '/farm/stock', labelKey: 'farm.plantStock', icon: plantsIcon, end: true },
          { to: '/farm/stock/balance', labelKey: 'farm.balance', icon: balanceIcon },
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
          { to: '/farm/fruits', labelKey: 'fruits.trees', icon: fruitsIcon, end: true },
          { to: '/farm/fruits/harvest', labelKey: 'dashboard.harvest', icon: harvestIcon },
          { to: '/farm/fruits/balance', labelKey: 'farm.balance', icon: balanceIcon },
          // { to: '/farm/fruits/products', labelKey: 'treeProduct.title', icon: fruitsIcon },
        ],
      },
      {
        // The group's own row is still the list of herds; only the balance hangs off it, so it
        // stays a link rather than becoming a heading. No `end` on the header, matching the
        // greenhouse group: it lights for anywhere in the area, including a herd's own pages.
        to: '/farm/livestock',
        labelKey: 'farm.livestock',
        icon: animalsIcon,
        requiresConfig: LIVESTOCK_CONFIG,
        children: [{ to: '/farm/livestock/balance', labelKey: 'farm.balance', icon: balanceIcon }],
      },
      { to: '/farm/equipment', labelKey: 'equipment.title', icon: equipmentIcon, restricted: true },
      {
        to: '/farm/types',
        labelKey: 'kindTypes.title',
        icon: plantsIcon,
        requiresEmail: CATALOG_ADMIN_EMAIL,
      },
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
      { to: '/farm/greenhouse/balance', labelKey: 'farm.balance', icon: balanceIcon },
    ],
  },
  // Every outlined field on one map — the user's own and their neighbourhood's.
  { to: '/map', labelKey: 'map.title', icon: mapIcon },
  // { to: '/scanner', labelKey: 'dashboard.aiPlantScanner', icon: cameraIcon },
  // The marketplace is reached from the topbar button beside the neighbours one, not from here.
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
  user: { plan?: StoragePlan; email?: string } | null | undefined,
  isConfigOn: (name: string) => boolean
): boolean {
  if (item.restricted && user?.plan === 'Free') return false;
  if (item.requiresConfig && !isConfigOn(item.requiresConfig)) return false;
  // Compared case-insensitively: the server lower-cases an email on write, but a session read
  // back from storage is whatever was stored when it was written.
  if (item.requiresEmail && user?.email?.toLowerCase() !== item.requiresEmail.toLowerCase()) return false;
  return true;
}
