import { useState } from 'react';

import { territoryAreaHectares, type TerritoryPoint } from '@/config/territory';
import { orchardColour } from '@/config/orchard-colours';
import { useLanguage } from '@/contexts/language-context';
import type { OrchardBlock, OrchardBlockInput } from '@/types/orchard-block';
import type { TreeSpotTreatment } from '@/types/tree-spot-treatment';
import type { TreeStock } from '@/types/tree-stock';
import { TreatmentPlanEdit } from './treatment-plan-edit';
import { TreatmentPlanHead } from './treatment-plan-head';
import { TreatmentPlanRail } from './treatment-plan-rail';
import { TreatmentPlanShape, type PickedTree } from './treatment-plan-shape';
import { TreatmentSpotForm } from './treatment-spot-form';
import { groupSpots, type SpotGroup } from './treatment-spot-groups';
import { TreatmentSpotList } from './treatment-spot-list';
import { usePlanEditor } from './use-plan-editor';
import './treatment-positioning.css';
import './treatment-spot.css';

type Props = {
  orchard: TreeStock | null;
  block: OrchardBlock | null;
  spots: TreeSpotTreatment[];
  /** Where a first block starts from — the land's own outline, or a square around a known spot. */
  seed: TerritoryPoint[];
  onSaved: (rows: TreeSpotTreatment[]) => void;
  onDeleted: (group: SpotGroup) => void;
  /** Null as the second argument means the orchard has no block yet and this is the first one. */
  onLayoutSaved: (input: OrchardBlockInput, existing: OrchardBlock | null) => Promise<void>;
};

export function TreatmentPositioning({
  orchard,
  block,
  spots,
  seed,
  onSaved,
  onDeleted,
  onLayoutSaved,
}: Props) {
  const { t } = useLanguage();
  const [picked, setPicked] = useState<PickedTree[]>([]);
  const [many, setMany] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);

  const editor = usePlanEditor({ orchard, block, seed, onSave: onLayoutSaved });

  if (!orchard || editor.outline.length < 3) {
    return (
      <div className="trt-pos is-empty">
        <p className="trt-pos-hint">{!orchard ? t('treatment.positionPick') : t('treatment.noGround')}</p>
      </div>
    );
  }

  const treated = new Set(spots.map((row) => row.treeIndex));
  const groups = groupSpots(spots);
  const hectares = territoryAreaHectares(editor.outline);

  function clearSelection() {
    setPicked([]);
    setOpenKey(null);
  }

  function pick(tree: PickedTree) {
    setOpenKey(null);
    setPicked((prev) => {
      const held = prev.some((row) => row.index === tree.index);
      if (held) return prev.filter((row) => row.index !== tree.index);
      return many ? [...prev, tree] : [tree];
    });
  }

  /* Opening a record marks the trees it covers. They land in the same selection a click on the
     drawing fills, so recording a follow-up on exactly those trees is already set up. */
  function openGroup(group: SpotGroup) {
    const same = group.key === openKey;
    setOpenKey(same ? null : group.key);
    setPicked(same ? [] : group.trees);
  }

  return (
    <div className="trt-pos">
      <TreatmentPlanHead orchard={orchard} creating={editor.creating} />

      <div className="trt-pos-body">
        <TreatmentPlanRail
          editing={editor.editing}
          many={many}
          picked={picked.length}
          dirty={editor.dirty}
          saving={editor.saving}
          onToggleEditing={() => {
            editor.setEditing(!editor.editing);
            clearSelection();
          }}
          onToggleMany={() => {
            setMany((prev) => !prev);
            setPicked((prev) => (many ? prev.slice(0, 1) : prev));
          }}
          onAssign={() => setFormOpen(true)}
          onClear={clearSelection}
          onSave={editor.save}
        />

        <TreatmentPlanShape
          outline={editor.outline}
          plan={editor.plan}
          pattern={editor.live.pattern}
          colour={orchardColour(orchard.id)}
          origin={editor.origin}
          editing={editor.editing}
          selected={picked}
          treated={treated}
          onPick={pick}
          onOutlineChange={editor.setShape}
        />

        <TreatmentSpotList groups={groups} activeKey={openKey} onPick={openGroup} onDelete={onDeleted} />
      </div>

      <TreatmentPlanEdit
        draft={editor.live}
        plan={editor.plan}
        hectares={hectares}
        onChange={editor.setDraft}
      />

      <p className="trt-pos-hint">
        {editor.editing
          ? t('positioning.drawHint')
          : picked.length === 0
            ? t('treatment.treePick')
            : t('positioning.placedOf', { placed: editor.plan.trees.length, total: editor.total })}
      </p>

      <TreatmentSpotForm
        open={formOpen}
        treeStockId={orchard.id}
        trees={picked}
        onClose={() => setFormOpen(false)}
        onSaved={(rows) => {
          onSaved(rows);
          setFormOpen(false);
        }}
      />
    </div>
  );
}
