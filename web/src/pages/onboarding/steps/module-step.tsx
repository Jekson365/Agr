import { FARM_MODULES } from '@/config/farm-modules';
import { useConfiguration } from '@/contexts/configuration-context';
import { useLanguage } from '@/contexts/language-context';
import type { FarmModule } from '@/types/auth';
import './module-step.css';

type Props = {
  value: FarmModule | null;
  onChange: (next: FarmModule) => void;
};

export function ModuleStep({ value, onChange }: Props) {
  const { t } = useLanguage();
  const { isOn } = useConfiguration();

  const modules = FARM_MODULES.filter((entry) => isOn(entry.config));

  return (
    <div className="onboarding-step">
      <div className="module-choice-warning" role="note">
        <span className="module-choice-warning-mark" aria-hidden="true">
          !
        </span>
        <div>
          <strong className="module-choice-warning-title">{t('onboarding.moduleWarningTitle')}</strong>
          <p className="module-choice-warning-text">{t('onboarding.moduleWarningText')}</p>
        </div>
      </div>

      <div className="module-choice" role="radiogroup" aria-label={t('onboarding.stepModule')}>
        {modules.map((entry) => {
          const selected = entry.module === value;
          return (
            <button
              key={entry.module}
              type="button"
              role="radio"
              aria-checked={selected}
              className={selected ? 'module-choice-card selected' : 'module-choice-card'}
              onClick={() => onChange(entry.module)}
            >
              {selected && <span className="module-choice-badge">{t('onboarding.moduleFree')}</span>}
              <img src={entry.icon} alt="" className="module-choice-icon" />
              <span className="module-choice-copy">
                <span className="module-choice-name">{t(entry.labelKey)}</span>
                <span className="module-choice-text">{t(entry.textKey)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
