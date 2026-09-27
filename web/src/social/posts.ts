import type { ComponentType } from 'react';

import coinIcon from '@/assets/coin.png';
import milkIcon from '@/assets/goods/milk.png';
import financesIcon from '@/assets/icons/finances.png';
import greenhouseIcon from '@/assets/icons/greenhouse.png';
import harvestIcon from '@/assets/icons/harvest.png';
import marketIcon from '@/assets/icons/market.png';
import reportIcon from '@/assets/icons/report.png';
import treeSeedIcon from '@/assets/icons/tree-seed.png';
import animalsIcon from '@/assets/properties/animals.png';
import fruitsIcon from '@/assets/properties/fruits.png';
import landIcon from '@/assets/properties/land.png';
import plantsIcon from '@/assets/properties/plants.png';
import seedIcon from '@/assets/seed.png';
import ka from '@/locales/ka.json';
import type { SocialFormat } from '@/social/formats';
import type { MascotId } from '@/social/mascots';
import { CropsCard } from '@/social/visuals/crops-card';
import { GreenhouseCard } from '@/social/visuals/greenhouse-card';
import { HarvestCard } from '@/social/visuals/harvest-card';
import { LivestockCard } from '@/social/visuals/livestock-card';
import { MapBackdrop, MapCard } from '@/social/visuals/map-card';
import { MarketCard } from '@/social/visuals/market-card';
import { OrchardCard } from '@/social/visuals/orchard-card';
import { ReportsCard } from '@/social/visuals/reports-card';

export type SocialTheme = 'light' | 'dark' | 'photo';

export type SocialPost = {
  slug: string;
  theme: SocialTheme;
  icon: string;
  eyebrow: string;
  title: string;
  accent: string;
  body: string;
  points: string[];
  mascot: MascotId;
  sticker?: string;
  lowVisual?: boolean;
  Visual: ComponentType;
  Backdrop?: ComponentType<{ format: SocialFormat }>;
};

const lead = (text: string) => text.split(/ — |: /)[0];

const { manage, harvest, market, reports, map } = ka.landing;

export const SOCIAL_POSTS: SocialPost[] = [
  {
    slug: 'crops',
    theme: 'light',
    icon: plantsIcon,
    eyebrow: manage.stock.title,
    title: manage.stock.point1,
    accent: 'ნებისმიერი',
    body: manage.stock.body,
    points: [manage.stock.point2, manage.stock.point3],
    mascot: 'maia',
    sticker: seedIcon,
    Visual: CropsCard,
  },
  {
    slug: 'harvest',
    theme: 'dark',
    icon: harvestIcon,
    eyebrow: harvest.eyebrow,
    title: harvest.title,
    accent: 'სრული ციკლის',
    body: harvest.subtitle,
    points: [harvest.stages.title, harvest.warehouse.title],
    mascot: 'tomaCalm',
    sticker: harvestIcon,
    Visual: HarvestCard,
  },
  {
    slug: 'orchard',
    theme: 'light',
    icon: fruitsIcon,
    eyebrow: ka.farm.fruits,
    title: manage.fruits.title,
    accent: 'ხეხილის ბაღის',
    body: manage.fruits.body,
    points: [lead(manage.fruits.point3), lead(manage.fruits.point1)],
    mascot: 'toma',
    sticker: treeSeedIcon,
    Visual: OrchardCard,
  },
  {
    slug: 'greenhouse',
    theme: 'dark',
    icon: greenhouseIcon,
    eyebrow: ka.farm.greenhouse,
    title: manage.greenhouse.title,
    accent: 'სათბურის',
    body: manage.greenhouse.body,
    points: [ka.greenhouse.positioning.title, ka.greenhouse.harvestTitle],
    mascot: 'maia',
    sticker: greenhouseIcon,
    Visual: GreenhouseCard,
  },
  {
    slug: 'livestock',
    theme: 'light',
    icon: animalsIcon,
    eyebrow: ka.farm.livestock,
    title: manage.livestock.title,
    accent: 'პირუტყვის',
    body: manage.livestock.body,
    points: [lead(manage.livestock.point4), ka.animalTree.title],
    mascot: 'tomaAnimals',
    sticker: milkIcon,
    Visual: LivestockCard,
  },
  {
    slug: 'market',
    theme: 'dark',
    icon: marketIcon,
    eyebrow: market.eyebrow,
    title: market.title,
    accent: 'საკუთარი ნაწარმი',
    body: market.subtitle,
    points: [market.buySell.title, market.equipment.title],
    mascot: 'toma',
    sticker: coinIcon,
    Visual: MarketCard,
  },
  {
    slug: 'reports',
    theme: 'light',
    icon: reportIcon,
    eyebrow: reports.eyebrow,
    title: reports.title,
    accent: 'ანალიტიკა',
    body: reports.harvest.body,
    points: [reports.financial.title, reports.inventory.title],
    mascot: 'tomaField',
    sticker: financesIcon,
    Visual: ReportsCard,
  },
  {
    slug: 'map',
    theme: 'photo',
    icon: landIcon,
    eyebrow: map.eyebrow,
    title: map.title,
    accent: 'მეზობელი',
    body: map.nearby.title,
    points: [map.draw.title, map.connect.title],
    mascot: 'maia',
    lowVisual: true,
    Visual: MapCard,
    Backdrop: MapBackdrop,
  },
];
