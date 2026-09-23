import type { PlantingPlan } from '@/config/orchard-layout';
import { rowSpacingIsDerived } from '@/config/planting-patterns';
import { formatArea } from '@/config/territory';
import { useLanguage } from '@/contexts/language-context';
import type { LayoutDraft } from './treatment-plan';
import './treatment-edit.css';

type Props = {
  draft: LayoutDraft;
  plan: PlantingPlan;
  hectares: number;
  onChange: (draft: LayoutDraft) => void;
};

/**
 * The spacings, and what they come to. The pattern and the rotation are the positioning page's to
 * set — they are decisions about the block, whereas the gaps are the number a grower adjusts while
 * looking at the planting.
 */
export function TreatmentPlanEdit({ draft, plan, hectares, onChange }: Props) {
  const { t } = useLanguage();

  const derived = rowSpacingIsDerived(draft.pattern);
  const round = (value: number) => String(Math.round(value * 100) / 100);
  const set = (part: Partial<LayoutDraft>) => onChange({ ...draft, ...part });

  return (
    <div className="trt-edit">
      <div className="trt-edit-row">
        <label className="trt-edit-field">
          <span>{t('positioning.treeSpacing')}</span>
          <input
            value={draft.treeSpacing}
            onChange={(e) => set({ treeSpacing: e.target.value })}
            inputMode="decimal"
          />
        </label>

        <label className="trt-edit-field">
          <span>{t('positioning.rowSpacing')}</span>
          <input
            value={derived ? round(plan.rowSpacing) : draft.rowSpacing}
            onChange={(e) => set({ rowSpacing: e.target.value })}
            disabled={derived}
            inputMode="decimal"
          />
        </label>

        <span className="trt-pos-fact">
          <b>{plan.trees.length}</b>
          <span>{t('positioning.treesPlaced')}</span>
        </span>
        <span className="trt-pos-fact">
          <b>{formatArea(hectares)}</b>
          <span>{t('positioning.hectares')}</span>
        </span>
        <span className="trt-pos-fact">
          <b>{hectares > 0 ? Math.round(plan.trees.length / hectares) : 0}</b>
          <span>{t('positioning.perHectare')}</span>
        </span>
      </div>

      {derived && <span className="limit-hint">{t('positioning.rowSpacingDerived')}</span>}
      {plan.truncated && <div className="error-banner">{t('positioning.tooDense')}</div>}
    </div>
  );
}
