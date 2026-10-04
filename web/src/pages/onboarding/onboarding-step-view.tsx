import { WINE_AREA } from '@/config/stock-areas';
import type { OnboardingDraft } from './onboarding-draft';
import type { OnboardingStepKey } from './onboarding-status';
import { FarmProfileStep } from './steps/farm-profile-step';
import { FruitStep } from './steps/fruit-step';
import { LandStep } from './steps/land-step';
import { LivestockStep } from './steps/livestock-step';
import { ModuleStep } from './steps/module-step';
import { StockStep } from './steps/stock-step';

type Props = {
  step: OnboardingStepKey;
  draft: OnboardingDraft;
  hasFarm: boolean;
  onChange: (next: OnboardingDraft) => void;
};

export function OnboardingStepView({ step, draft, hasFarm, onChange }: Props) {
  switch (step) {
    case 'profile':
      return <FarmProfileStep value={draft.profile} onChange={(profile) => onChange({ ...draft, profile })} />;
    case 'module':
      return <ModuleStep value={draft.module} onChange={(choice) => onChange({ ...draft, module: choice })} />;
    case 'land':
      return <LandStep value={draft.land} onChange={(land) => onChange({ ...draft, land })} />;
    case 'stock':
      return <StockStep value={draft.stock} onChange={(stock) => onChange({ ...draft, stock })} />;
    case 'livestock':
      return (
        <LivestockStep
          value={draft.livestock}
          hasFarm={hasFarm}
          onChange={(livestock) => onChange({ ...draft, livestock })}
        />
      );
    case 'fruit':
      return <FruitStep value={draft.fruit} onChange={(fruit) => onChange({ ...draft, fruit })} />;
    case 'wine':
      return <StockStep value={draft.wine} area={WINE_AREA} onChange={(wine) => onChange({ ...draft, wine })} />;
  }
}
