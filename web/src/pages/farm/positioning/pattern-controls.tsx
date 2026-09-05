import { effectiveRowSpacing, type PlantingPattern, type PlantingPlan } from '@/config/orchard-layout';
import {
  PLANTING_PATTERNS,
  PLANTING_PATTERN_HINT_KEY,
  PLANTING_PATTERN_LABEL_KEY,
  rowSpacingIsDerived,
} from '@/config/planting-patterns';
import { useLanguage } from '@/contexts/language-context';

export type PatternDraft = {
  pattern: PlantingPattern;
  treeSpacing: string;
  rowSpacing: string;
  rotation: string;
};

type Props = {
  draft: PatternDraft;
  plan: PlantingPlan;
  available: number;
  onChange: (draft: PatternDraft) => void;
};

export function PatternControls({ draft, plan, available, onChange }: Props) {
  const { t } = useLanguage();

  const derived = rowSpacingIsDerived(draft.pattern);
  const round = (value: number) => String(Math.round(value * 100) / 100);

  // The fields show what was typed, never what the plan settled on. They are the ask; the plan is
  // the answer, and writing the answer back into the field being typed in freezes it.
  const derivedRows = effectiveRowSpacing(draft.pattern, Number(draft.treeSpacing) || 0, 0);

  function set(part: Partial<PatternDraft>) {
    onChange({ ...draft, ...part });
  }

  return (
    <div className="pos-controls">
      <div className="field">
        <label>{t('positioning.pattern')}</label>
        <div className="kind-row">
          {PLANTING_PATTERNS.map((option) => (
            <button
              key={option}
              type="button"
              className={draft.pattern === option ? 'kind-chip active' : 'kind-chip'}
              onClick={() => set({ pattern: option })}
            >
              <span>{t(PLANTING_PATTERN_LABEL_KEY[option])}</span>
            </button>
          ))}
        </div>
        <span className="limit-hint">{t(PLANTING_PATTERN_HINT_KEY[draft.pattern])}</span>
      </div>

      <div className="field-row">
        <div className="field">
          <label>{t('positioning.treeSpacing')}</label>
          <input
            value={draft.treeSpacing}
            onChange={(e) => set({ treeSpacing: e.target.value })}
            inputMode="decimal"
          />
        </div>
        <div className="field">
          <label>{t('positioning.rowSpacing')}</label>
          <input
            value={derived ? round(derivedRows) : draft.rowSpacing}
            onChange={(e) => set({ rowSpacing: e.target.value })}
            disabled={derived}
            inputMode="decimal"
          />
          {derived && <span className="limit-hint">{t('positioning.rowSpacingDerived')}</span>}
        </div>
      </div>

      <div className="field">
        <label>{t('positioning.rotation')}</label>
        <input value={draft.rotation} onChange={(e) => set({ rotation: e.target.value })} inputMode="numeric" />
        <span className="limit-hint">{t('positioning.rotationHint')}</span>
      </div>

      <div className="pos-summary">
        <span className="pos-summary-figure">
          <strong>{plan.trees.length}</strong>
          <span>{t('positioning.treesPlaced')}</span>
        </span>
        <span className="pos-summary-figure">
          <strong>{(Math.round(plan.area) / 10000).toFixed(2)}</strong>
          <span>{t('positioning.hectares')}</span>
        </span>
        <span className="pos-summary-figure">
          <strong>{plan.area > 0 ? Math.round((plan.trees.length / plan.area) * 10000) : 0}</strong>
          <span>{t('positioning.perHectare')}</span>
        </span>
      </div>

      {plan.fitted && (
        <p className="limit-hint">
          {t('positioning.fitted', {
            tree: round(plan.treeSpacing),
            row: round(plan.rowSpacing),
            total: available,
          })}
        </p>
      )}

      {/* The ground would not take them all at these spacings. Said rather than corrected — the
          outline is the outline, and tightening it up is the farmer's call. */}
      {!plan.fitted && available > 0 && plan.trees.length > 0 && plan.trees.length < available && (
        <p className="limit-hint">
          {t('positioning.fitsFewer', { fits: plan.trees.length, total: available })}
        </p>
      )}

      {plan.truncated && <div className="error-banner">{t('positioning.tooDense')}</div>}
    </div>
  );
}
