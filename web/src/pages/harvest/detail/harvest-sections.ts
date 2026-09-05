import { lazy } from 'react';

import type { HarvestStatus } from '@/types/harvest';
import type { HarvestSection } from './harvest-section-nav';

export const SECTION_FOR_STATUS: Record<HarvestStatus, HarvestSection> = {
  Planning: 'seeds',
  Planting: 'seeds',
  Emergence: 'chemicals',
  Flowering: 'chemicals',
  Ripening: 'chemicals',
  HarvestReady: 'result',
  Harvested: 'overview',
  TransferredToBalance: 'overview',
};

export const OverviewSection = lazy(() =>
  import('./overview-section').then((m) => ({ default: m.OverviewSection }))
);
export const SeedSection = lazy(() => import('./seed-section').then((m) => ({ default: m.SeedSection })));
export const TreeSection = lazy(() => import('./tree-section').then((m) => ({ default: m.TreeSection })));
export const ResultSection = lazy(() => import('./result-section').then((m) => ({ default: m.ResultSection })));
export const MoneySection = lazy(() => import('./money-section').then((m) => ({ default: m.MoneySection })));
export const ChemicalSection = lazy(() =>
  import('./chemical-section').then((m) => ({ default: m.ChemicalSection }))
);
export const GradingSection = lazy(() =>
  import('@/pages/harvest/grading/grading-section').then((m) => ({ default: m.GradingSection }))
);
