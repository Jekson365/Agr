import { useLanguage } from '@/contexts/language-context';
import { ONBOARDING_STEP_LABEL_KEY, type OnboardingStepKey } from './onboarding-status';
import './onboarding-progress.css';

type Props = {
  steps: OnboardingStepKey[];
  todo: OnboardingStepKey[];
  index: number;
  reached: number;
  onSelect: (step: OnboardingStepKey) => void;
};

export function OnboardingProgress({ steps, todo, index, reached, onSelect }: Props) {
  const { t } = useLanguage();

  function stateOf(step: OnboardingStepKey): string {
    const position = todo.indexOf(step);
    if (position === -1 || position < index) return 'done';
    return position === index ? 'current' : 'todo';
  }

  function isReachable(step: OnboardingStepKey): boolean {
    const position = todo.indexOf(step);
    return position !== -1 && position <= reached;
  }

  return (
    <ol className="onboarding-progress">
      {steps.map((step, order) => {
        const state = stateOf(step);
        return (
          <li key={step} className={`onboarding-progress-item ${state}`}>
            <button
              type="button"
              className="onboarding-progress-button"
              disabled={!isReachable(step)}
              onClick={() => onSelect(step)}
            >
              <span className="onboarding-progress-dot">{state === 'done' ? '✓' : order + 1}</span>
              <span className="onboarding-progress-label">{t(ONBOARDING_STEP_LABEL_KEY[step])}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
