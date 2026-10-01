import en from '@/locales/en.json';
import ka from '@/locales/ka.json';
import { EN_GAPS } from '@/promo/en-gaps';
import { LANGUAGE } from '@/promo/locale';

export type CaptionText = { eyebrow: string; title: string; body: string };

type CaptionId = 'intro' | 'harvest' | 'grading' | 'livestock' | 'breeding' | 'reports';

const KA_CAPTIONS: Record<CaptionId, CaptionText> = {
  intro: {
    eyebrow: ka.landing.hero.badge,
    title: ka.landing.hero.title,
    body: ka.landing.cta.subtitle,
  },
  harvest: {
    eyebrow: ka.landing.harvest.eyebrow,
    title: ka.landing.harvest.title,
    body: ka.landing.harvest.subtitle,
  },
  grading: {
    eyebrow: ka.harvestGrading.title,
    title: ka.landing.harvest.quality.title,
    body: ka.landing.harvest.quality.body,
  },
  livestock: {
    eyebrow: ka.farm.livestock,
    title: 'პირუტყვის მართვა',
    body: ka.landing.manage.livestock.body,
  },
  breeding: {
    eyebrow: ka.breedingEvent.title,
    title: 'გამრავლების ჩანაწერები',
    body: '',
  },
  reports: {
    eyebrow: ka.landing.reports.eyebrow,
    title: ka.landing.reports.title,
    body: ka.landing.reports.harvest.body,
  },
};

const EN_CAPTIONS: Record<CaptionId, CaptionText> = {
  intro: {
    eyebrow: en.landing.hero.badge,
    title: 'Run your farm from one place',
    body: en.landing.cta.subtitle,
  },
  harvest: {
    eyebrow: en.landing.harvest.eyebrow,
    title: en.landing.harvest.title,
    body: en.landing.harvest.subtitle,
  },
  grading: {
    eyebrow: EN_GAPS.harvestGrading.title,
    title: en.landing.harvest.quality.title,
    body: en.landing.harvest.quality.body,
  },
  livestock: {
    eyebrow: en.farm.livestock,
    title: 'Livestock management',
    body: "Keep an eye on every animal's health, growth and history.",
  },
  breeding: {
    eyebrow: en.breedingEvent.title,
    title: 'Herd breeding records',
    body: 'Add a pairing, choose the female and the male, then update its status.',
  },
  reports: {
    eyebrow: en.landing.reports.eyebrow,
    title: en.landing.reports.title,
    body: 'Yield, revenue, costs and net profit, by crop or by period.',
  },
};

export const CAPTION_TEXT = LANGUAGE === 'en' ? EN_CAPTIONS : KA_CAPTIONS;
