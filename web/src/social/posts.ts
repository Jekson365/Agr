import type { ComponentType } from 'react';

import cowIcon from '@/assets/animals/cow.png';
import coinIcon from '@/assets/coin.png';
import grapeIcon from '@/assets/goods/grape.png';
import milkIcon from '@/assets/goods/milk.png';
import tomatoIcon from '@/assets/goods/tomato.png';
import calendarIcon from '@/assets/icons/calendar.png';
import farmIcon from '@/assets/icons/farm.png';
import financesIcon from '@/assets/icons/finances.png';
import greenhouseIcon from '@/assets/icons/greenhouse.png';
import harvestIcon from '@/assets/icons/harvest.png';
import marketIcon from '@/assets/icons/market.png';
import reportIcon from '@/assets/icons/report.png';
import treeSeedIcon from '@/assets/icons/tree-seed.png';
import wineBottleIcon from '@/assets/icons/wine-bottle.svg';
import animalsIcon from '@/assets/properties/animals.png';
import fruitsIcon from '@/assets/properties/fruits.png';
import landIcon from '@/assets/properties/land.png';
import plantsIcon from '@/assets/properties/plants.png';
import seedIcon from '@/assets/seed.png';
import { LANGUAGE } from '@/promo/locale';
import { EN_POSTS } from '@/social/copy/en';
import { KA_POSTS } from '@/social/copy/ka';
import type { PostCopy, PostSlug } from '@/social/copy/post-copy';
import type { SocialFormat } from '@/social/formats';
import type { MascotId } from '@/social/mascots';
import { AnimalCard } from '@/social/visuals/animal-card';
import { CompareCard } from '@/social/visuals/compare-card';
import { CropsCard } from '@/social/visuals/crops-card';
import { GreenhouseCard } from '@/social/visuals/greenhouse-card';
import { HarvestCard } from '@/social/visuals/harvest-card';
import { LivestockCard } from '@/social/visuals/livestock-card';
import { MapBackdrop, MapCard } from '@/social/visuals/map-card';
import { MarketCard } from '@/social/visuals/market-card';
import { OrchardCard } from '@/social/visuals/orchard-card';
import { OverviewCard } from '@/social/visuals/overview-card';
import { PaperworkCard } from '@/social/visuals/paperwork-card';
import { ReportsCard } from '@/social/visuals/reports-card';
import { TimelineCard } from '@/social/visuals/timeline-card';
import { WineryCard } from '@/social/visuals/winery-card';

export type SocialTheme = 'light' | 'dark' | 'photo';

export type SocialPost = PostCopy & {
  slug: PostSlug;
  theme: SocialTheme;
  icon: string;
  mascot: MascotId;
  companion?: MascotId;
  sticker?: string;
  lowVisual?: boolean;
  Visual: ComponentType;
  Backdrop?: ComponentType<{ format: SocialFormat }>;
};

const COPY = LANGUAGE === 'en' ? EN_POSTS : KA_POSTS;

const post = (slug: PostSlug, look: Omit<SocialPost, 'slug' | keyof PostCopy>): SocialPost => ({
  slug,
  ...COPY[slug],
  ...look,
});

export const SOCIAL_POSTS: SocialPost[] = [
  post('crops', {
    theme: 'light',
    icon: plantsIcon,
    mascot: 'maia',
    sticker: seedIcon,
    Visual: CropsCard,
  }),
  post('harvest', {
    theme: 'dark',
    icon: harvestIcon,
    mascot: 'tomaCalm',
    sticker: harvestIcon,
    Visual: HarvestCard,
  }),
  post('orchard', {
    theme: 'light',
    icon: fruitsIcon,
    mascot: 'toma',
    sticker: treeSeedIcon,
    Visual: OrchardCard,
  }),
  post('greenhouse', {
    theme: 'dark',
    icon: greenhouseIcon,
    mascot: 'maia',
    sticker: greenhouseIcon,
    Visual: GreenhouseCard,
  }),
  post('livestock', {
    theme: 'light',
    icon: animalsIcon,
    mascot: 'tomaAnimals',
    sticker: milkIcon,
    Visual: LivestockCard,
  }),
  post('market', {
    theme: 'dark',
    icon: marketIcon,
    mascot: 'toma',
    sticker: coinIcon,
    Visual: MarketCard,
  }),
  post('reports', {
    theme: 'light',
    icon: reportIcon,
    mascot: 'tomaField',
    sticker: financesIcon,
    Visual: ReportsCard,
  }),
  post('map', {
    theme: 'photo',
    icon: landIcon,
    mascot: 'maia',
    lowVisual: true,
    Visual: MapCard,
    Backdrop: MapBackdrop,
  }),
  post('timeline', {
    theme: 'light',
    icon: calendarIcon,
    mascot: 'toma',
    sticker: harvestIcon,
    Visual: TimelineCard,
  }),
  post('paperwork', {
    theme: 'dark',
    icon: reportIcon,
    mascot: 'toma',
    companion: 'maia',
    Visual: PaperworkCard,
  }),
  post('animal-profile', {
    theme: 'light',
    icon: cowIcon,
    mascot: 'maia',
    Visual: AnimalCard,
  }),
  post('overview', {
    theme: 'dark',
    icon: farmIcon,
    mascot: 'toma',
    companion: 'maia',
    Visual: OverviewCard,
  }),
  post('harvest-compare', {
    theme: 'light',
    icon: reportIcon,
    mascot: 'tomaCalm',
    sticker: tomatoIcon,
    Visual: CompareCard,
  }),
  post('winery', {
    theme: 'dark',
    icon: grapeIcon,
    mascot: 'tomaWine',
    sticker: wineBottleIcon,
    Visual: WineryCard,
  }),
];
