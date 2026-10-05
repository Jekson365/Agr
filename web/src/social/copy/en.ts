import en from '@/locales/en.json';
import type {
  AnimalLabels,
  CompareLabels,
  CoverCopy,
  PaperworkLabels,
  PostCopy,
  PostSlug,
  WineryLabels,
} from '@/social/copy/post-copy';

const { harvest, market, reports, map } = en.landing;

const together = (text: string) => text.replaceAll(' ', String.fromCharCode(0xa0));

export const EN_POSTS: Record<PostSlug, PostCopy> = {
  crops: {
    eyebrow: 'Crop farming',
    title: 'Add any crop to your farm',
    accent: 'any crop',
    body: `Keep track of the income and expenses of every crop you grow, ${together('season after season')}.`,
    points: ['Photo history', 'Harvest planning and tracking'],
  },
  harvest: {
    eyebrow: harvest.eyebrow,
    title: harvest.title,
    accent: 'start to finish',
    body: harvest.subtitle,
    points: ['Stages and dates', harvest.warehouse.title],
  },
  orchard: {
    eyebrow: 'Fruit growing',
    title: 'Fruit orchard management',
    accent: 'Fruit orchard',
    body: `Perennial crops need special care and careful planning of ${together('the space they grow in')}.`,
    points: ['Care calendar', 'Tree nursery'],
  },
  greenhouse: {
    eyebrow: en.farm.greenhouse,
    title: 'Greenhouse management',
    accent: 'Greenhouse',
    body: `Covered growing, planned down to the square metre, ${together('floor by floor')} and section by section.`,
    points: ['Greenhouse layout', en.greenhouse.harvestTitle],
  },
  livestock: {
    eyebrow: en.farm.livestock,
    title: 'Livestock management',
    accent: 'Livestock',
    body: `Keep an eye on every animal's health, growth and history, ${together('from a single calf')} to the whole herd.`,
    points: ['Production tracking', en.animalTree.title],
  },
  market: {
    eyebrow: market.eyebrow,
    title: 'Sell your own farm produce',
    accent: 'own farm produce',
    body: `An agricultural marketplace for farmers, wired straight into ${together('the stock you already track')}.`,
    points: ['Buy & sell', market.equipment.title],
  },
  reports: {
    eyebrow: reports.eyebrow,
    title: 'Farm reports and analytics',
    accent: 'analytics',
    body: `See yield, revenue, costs and net profit, broken down by crop or ${together('by any period you choose')}.`,
    points: [reports.financial.title, reports.inventory.title],
  },
  map: {
    eyebrow: map.eyebrow,
    title: "Your land and your neighbours'",
    accent: "neighbours'",
    body: map.nearby.title,
    points: [map.draw.title, map.connect.title],
  },
  timeline: {
    eyebrow: en.dashboard.calendar,
    title: 'Harvest timeline',
    accent: 'timeline',
    body: `One calendar shows your field, orchard and greenhouse dates ${together('on a single screen')}, with the weather forecast.`,
    points: [en.harvest.expectedDate, 'Mark days for field work'],
  },
  paperwork: {
    eyebrow: 'Why Mtabari?',
    title: 'Tired of notebooks and Excel?',
    accent: 'Tired',
    body: 'Pages go missing, formulas break, hours go into adding up. Mtabari does the counting for you.',
    points: ['Automatic reports', 'Every record in one place'],
  },
  'animal-profile': {
    eyebrow: en.farm.livestock,
    title: 'Every animal gets its own profile',
    accent: 'Every animal',
    body: `Ear tag, weight, vaccinations and parents — every animal's history ${together('is kept separately')}.`,
    points: [en.history.title, en.history.medicalTab],
  },
  overview: {
    eyebrow: 'All features',
    title: 'Your whole farm in one place',
    accent: 'in one place',
    body: 'From the land to the market — everything a farm needs.',
    points: ['On your phone and computer', 'Automatic reports'],
  },
  'harvest-compare': {
    eyebrow: 'Statistics',
    title: 'Compare with your last harvest',
    accent: 'your last harvest',
    body: 'See how much your harvest has grown.',
    points: ['Yield, revenue and profit', 'Every harvest on one chart'],
  },
  winery: {
    eyebrow: 'Winemaking',
    title: 'From the vineyard to the bottle',
    accent: 'to the bottle',
    body: `Pick the grapes, make the wine ${together('and fill the bottles')}.`,
    points: ['From the harvest straight to the cellar', 'Balances update themselves'],
  },
};

export const EN_WINERY: WineryLabels = {
  harvest: 'Grape harvest',
  making: 'Winemaking',
  bottling: 'Bottling',
  bottles: 'bottles',
};

export const EN_COVER: CoverCopy = {
  title: 'Your whole farm in one place',
  accent: 'in one place',
};

export const EN_ANIMAL: AnimalLabels = {
  vaccination: 'Vaccination',
  checkup: 'Check-up',
  genetics: 'Genetics',
};

export const EN_COMPARE: CompareLabels = {
  previous: 'Last harvest',
  current: 'This harvest',
  versus: 'compared with the last harvest',
  before: 'Was',
  profit: 'Net profit',
};

export const EN_PAPERWORK: PaperworkLabels = {
  paper: 'Notebook & Excel',
  paperTime: '3 hrs',
  appTime: '5 min',
};
