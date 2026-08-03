import chickenIcon from '@/assets/animals/chicken.png';
import cowIcon from '@/assets/animals/cow.png';
import goatIcon from '@/assets/animals/goat.png';
import sheepIcon from '@/assets/animals/sheep.png';
import cabbageIcon from '@/assets/goods/cabbage.png';
import cucumberIcon from '@/assets/goods/cucumber.png';
import tomatoIcon from '@/assets/goods/tomato.png';
import calendarIcon from '@/assets/icons/calendar.png';
import cameraIcon from '@/assets/icons/camera.png';
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

/**
 * Content model for the public landing page (/main). Copy lives in the locale files under
 * `landing.*`; only the structure, the icons and the numbers live here, so the page component
 * stays layout-only.
 */

/** A feature block: illustrated icon, a line of copy and the bullets under it. */
export type LandingCard = {
  id: string;
  icon: string;
  /** Number of `point1…pointN` keys to read under this card's translation group. */
  points: number;
};

/** One available packet. `null` anywhere in `limits` means that plan has no cap on it. */
export type LandingPacket = {
  id: string;
  /** The plan's name, reusing the profile screen's wording. */
  nameKey: string;
  /** Monthly price in GEL, rendered through the page's currency formatter. */
  price: number;
  /** The middle tier is the recommendation — it carries the badge and the raised card. */
  featured: boolean;
  limits: {
    land: number | null;
    livestock: number | null;
    stock: number | null;
    fruit: number | null;
    scans: number | null;
    storageMb: number | null;
    equipment: boolean;
  };
};

/*
 * Section 2 — the available packets.
 *
 * The caps below mirror server/Models/PlanLimits.cs and server/Models/StoragePlan.cs. The landing
 * page is public and makes no API call of its own, so these are a hand-kept copy rather than a
 * read — when a limit moves on the server, move it here too.
 *
 * TODO(pricing): THE THREE `price` VALUES ARE PLACEHOLDERS. Nothing in this repo prices a plan —
 * StoragePlan carries no amount and there is no billing anywhere — so these numbers were invented
 * purely so the section could render. Replace them with the real figures before /main goes public.
 */
export const PLAN_PACKETS: LandingPacket[] = [
  {
    id: 'free',
    nameKey: 'profile.planFree',
    price: 0,
    featured: false,
    limits: { land: 1, livestock: 3, stock: 3, fruit: 3, scans: 1, storageMb: 50, equipment: false },
  },
  {
    id: 'medium',
    nameKey: 'profile.planMedium',
    price: 19,
    featured: true,
    limits: { land: 3, livestock: 10, stock: 10, fruit: 10, scans: 5, storageMb: 300, equipment: true },
  },
  {
    id: 'premium',
    nameKey: 'profile.planPremium',
    price: 49,
    featured: false,
    limits: {
      land: null,
      livestock: null,
      stock: null,
      fruit: null,
      scans: null,
      storageMb: null,
      equipment: true,
    },
  },
];

/** How each row of a packet card is labelled and rendered, in display order. The labels reuse the
 *  profile screen's keys so the landing page and the app name the same cap the same way. */
export const PACKET_ROWS: {
  id: keyof LandingPacket['limits'];
  labelKey: string;
  kind: 'count' | 'perDay' | 'storage' | 'boolean';
}[] = [
  { id: 'land', labelKey: 'profile.limitLand', kind: 'count' },
  { id: 'livestock', labelKey: 'profile.limitLivestock', kind: 'count' },
  { id: 'stock', labelKey: 'profile.limitStock', kind: 'count' },
  { id: 'fruit', labelKey: 'profile.limitFruit', kind: 'count' },
  { id: 'scans', labelKey: 'landing.packets.rowScans', kind: 'perDay' },
  { id: 'storageMb', labelKey: 'plans.storage', kind: 'storage' },
  { id: 'equipment', labelKey: 'profile.limitEquipment', kind: 'boolean' },
];

/** Section 3 — "Everything you can manage". */
export const MANAGE_CARDS: LandingCard[] = [
  { id: 'stock', icon: plantsIcon, points: 4 },
  { id: 'livestock', icon: animalsIcon, points: 4 },
  { id: 'fruits', icon: fruitsIcon, points: 4 },
  { id: 'greenhouse', icon: greenhouseIcon, points: 4 },
];

/** Section 4 — harvest management. */
export const HARVEST_FEATURES: LandingCard[] = [
  { id: 'record', icon: harvestIcon, points: 0 },
  { id: 'warehouse', icon: plantsIcon, points: 0 },
  { id: 'quality', icon: balanceIcon, points: 0 },
  { id: 'history', icon: calendarIcon, points: 0 },
];

/** Section 5 — marketplace categories. */
export const MARKET_CATEGORIES: LandingCard[] = [
  { id: 'buySell', icon: marketIcon, points: 0 },
  { id: 'equipment', icon: equipmentIcon, points: 0 },
  { id: 'livestock', icon: cowIcon, points: 0 },
  { id: 'produce', icon: tomatoIcon, points: 0 },
  { id: 'seeds', icon: seedIcon, points: 0 },
];

/** Sample listings shown beside the marketplace copy. */
export const MARKET_SAMPLES = [
  { id: 'tomato', icon: tomatoIcon, price: 2.4 },
  { id: 'tractor', icon: equipmentIcon, price: 180 },
  { id: 'calf', icon: cowIcon, price: 1450 },
];

/** Section 6 — reporting. */
export const REPORT_FEATURES: LandingCard[] = [
  { id: 'inventory', icon: plantsIcon, points: 0 },
  { id: 'harvest', icon: harvestIcon, points: 0 },
  { id: 'financial', icon: balanceIcon, points: 0 },
  { id: 'livestock', icon: animalsIcon, points: 0 },
  { id: 'greenhouse', icon: greenhouseIcon, points: 0 },
];

/** Section 7 — the neighbourhood map. */
export const MAP_FEATURES: LandingCard[] = [
  { id: 'draw', icon: landIcon, points: 0 },
  { id: 'nearby', icon: mapIcon, points: 0 },
  { id: 'crops', icon: plantsIcon, points: 0 },
  { id: 'connect', icon: farmIcon, points: 0 },
];

/** The box the mocked map is drawn in. The panel holds the same ratio, so a pin placed in these
 *  coordinates lands on the same patch of ground at every screen size. */
export const MAP_VIEWBOX = { width: 320, height: 240 };

/** One outline on the mocked map. `owner` carries the real map's own/neighbour/other colouring, so
 *  what a visitor learns here is what they will see once they sign in. */
export type LandingMapField = {
  id: string;
  owner: 'own' | 'neighbour' | 'other';
  /** Drawn picked out — it is the field the card underneath is describing. */
  selected?: boolean;
  /** The letter its owner's pin carries, as the app builds it from their name. */
  initial: string;
  /** Whose it is, in the `landing.map` translation group; the user's own reuses the app's wording. */
  nameKey: string;
  /** Corners, in `MAP_VIEWBOX` coordinates. */
  points: string;
  /** The middle of the outline, where the pin and the name sit. */
  pin: { x: number; y: number };
};

/* The card sits across the bottom of the panel, so every outline is kept to the top two thirds —
   below that a pin would be behind it. */
export const MAP_FIELDS: LandingMapField[] = [
  {
    id: 'own',
    owner: 'own',
    initial: 'T',
    nameKey: 'map.you',
    points: '34,44 108,32 126,84 56,98',
    pin: { x: 80, y: 64 },
  },
  {
    id: 'neighbour',
    owner: 'neighbour',
    initial: 'N',
    nameKey: 'landing.map.farmerNeighbour',
    points: '176,40 258,30 276,80 196,96',
    pin: { x: 226, y: 61 },
  },
  {
    id: 'selected',
    owner: 'other',
    selected: true,
    initial: 'L',
    nameKey: 'landing.map.farmerSelected',
    points: '198,112 286,102 300,152 214,166',
    pin: { x: 249, y: 132 },
  },
  {
    id: 'other',
    owner: 'other',
    initial: 'G',
    nameKey: 'landing.map.farmerOther',
    points: '40,118 116,108 130,152 52,162',
    pin: { x: 84, y: 134 },
  },
];

/** What the picked field is growing, as the map's panel lists it — name and area in hectares. */
export const MAP_SAMPLE_CROPS = [
  { id: 'tomato', nameKey: 'landing.harvest.sampleTomato', icon: tomatoIcon, area: 0.8 },
  { id: 'cucumber', nameKey: 'landing.harvest.sampleCucumber', icon: cucumberIcon, area: 0.4 },
];

/** The revenue-by-category donut in the reporting section (shares add up to 100). */
export const REPORT_SHARES = [
  { id: 'crop', share: 44, color: 'var(--color-green)' },
  { id: 'fruit', share: 31, color: 'var(--color-amber)' },
  { id: 'livestock', share: 25, color: 'var(--landing-accent-soft)' },
];

/** Icons used by the mocked-up app preview in the hero and the phone frame. */
export const PREVIEW_ICONS = {
  farm: farmIcon,
  harvest: harvestIcon,
  livestock: animalsIcon,
  land: landIcon,
  market: marketIcon,
  report: reportIcon,
  calendar: calendarIcon,
  greenhouse: greenhouseIcon,
  plants: plantsIcon,
  fruits: fruitsIcon,
  balance: balanceIcon,
  scanner: cameraIcon,
};

/** Bar heights (percentages) for the mocked harvest chart in the preview. */
export const PREVIEW_BARS = [38, 54, 46, 72, 61, 88, 67];

/* The screens behind the preview's sidebar. Each one is a few rows of the kind of record the
   section actually holds — enough that clicking through says what the app is, without pretending
   to be the app. */

/** Herds and flocks, as the livestock screen lists them. */
export const PREVIEW_LIVESTOCK = [
  { id: 'cow', icon: cowIcon, nameKey: 'farm.cow', count: 24 },
  { id: 'sheep', icon: sheepIcon, nameKey: 'farm.sheep', count: 62 },
  { id: 'chicken', icon: chickenIcon, nameKey: 'farm.chicken', count: 140 },
  { id: 'goat', icon: goatIcon, nameKey: 'farm.goat', count: 18 },
];

/** What is under cover, and on how many square metres. */
export const PREVIEW_GREENHOUSE = [
  { id: 'tomato', icon: tomatoIcon, nameKey: 'landing.harvest.sampleTomato', section: 'A', sqm: 180 },
  { id: 'cucumber', icon: cucumberIcon, nameKey: 'landing.harvest.sampleCucumber', section: 'B', sqm: 120 },
  { id: 'cabbage', icon: cabbageIcon, nameKey: 'landing.harvest.sampleCabbage', section: 'C', sqm: 90 },
];
