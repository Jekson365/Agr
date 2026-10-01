import cucumberIcon from '@/assets/goods/cucumber.png';
import tomatoIcon from '@/assets/goods/tomato.png';
import type { HarvestActivity } from '@/config/harvest-activity';
import { buildDays, type TimelineHarvest } from '@/pages/harvest/timeline/harvest-timeline-spans';
import { copy } from '@/promo/locale';

type Sample = Pick<TimelineHarvest, 'key' | 'title' | 'status' | 'source' | 'start' | 'end'> & {
  icons: string[];
  marks: Record<string, HarvestActivity[]>;
};

const SAMPLES: Sample[] = [
  {
    key: 'crop-4',
    title: copy.farm.stockTomato,
    status: 'Ripening',
    source: 'crop',
    start: '2026-09-10',
    end: '2026-10-01',
    icons: [tomatoIcon],
    marks: { '2026-09-30': ['Irrigation'] },
  },
  {
    key: 'fruit-3',
    title: copy.farm.fruitApple,
    status: 'HarvestReady',
    source: 'fruit',
    start: '2026-09-29',
    end: '2026-10-03',
    icons: [],
    marks: { '2026-10-01': ['Inspection'] },
  },
  {
    key: 'greenhouse-2',
    title: copy.farm.stockCucumber,
    status: 'Flowering',
    source: 'greenhouse',
    start: '2026-09-30',
    end: '2026-10-18',
    icons: [cucumberIcon],
    marks: { '2026-10-02': ['Fertilization'], '2026-10-04': ['CropProtection'] },
  },
];

export const TIMELINE_DAYS = buildDays(new Date(2026, 8, 28), 7);

export const TIMELINE_TODAY = '2026-09-30';

export const TIMELINE_WEATHER = [
  { code: 1000, max: 24, min: 13 },
  { code: 1003, max: 22, min: 12 },
  { code: 1000, max: 23, min: 12 },
  { code: 1183, max: 18, min: 11 },
  { code: 1063, max: 17, min: 10 },
  { code: 1003, max: 19, min: 10 },
  { code: 1000, max: 21, min: 11 },
];

export const TIMELINE_HARVESTS: TimelineHarvest[] = SAMPLES.map(({ key, title, status, source, start, end }) => ({
  key,
  title,
  status,
  source,
  start,
  end,
  path: '',
  overdue: false,
}));

export const TIMELINE_ICONS = new Map(SAMPLES.map((sample) => [sample.key, sample.icons]));

export const TIMELINE_MARKS = new Map(
  SAMPLES.flatMap((sample) =>
    Object.entries(sample.marks).map(([date, items]) => [`${sample.key}|${date}`, items] as const)
  )
);
