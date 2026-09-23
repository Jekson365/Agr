import { useMemo, useState } from 'react';

import { centroidOf } from '@/config/orchard-geometry';
import { parseTerritory, serializeTerritory, type TerritoryPoint } from '@/config/territory';
import type { OrchardBlock, OrchardBlockInput } from '@/types/orchard-block';
import type { TreeStock } from '@/types/tree-stock';
import { blankDraft, draftOfBlock, sameDraft, useOrchardPlan, type LayoutDraft } from './treatment-plan';

type Args = {
  orchard: TreeStock | null;
  block: OrchardBlock | null;
  /** Where a first layout starts from — see `treatment-seed`. Must be a stable reference. */
  seed: TerritoryPoint[];
  onSave: (input: OrchardBlockInput, existing: OrchardBlock | null) => Promise<void>;
};

/** The orchard's layout as it is being worked on: the shape, the spacings, and whether either has
 *  moved away from what is stored. */
export function usePlanEditor({ orchard, block, seed, onSave }: Args) {
  const [draft, setDraft] = useState<LayoutDraft | null>(null);
  /** The outline as it is being edited, or null while it is still the stored one. */
  const [shape, setShape] = useState<TerritoryPoint[] | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const total = orchard ? Math.floor(orchard.amount) : 0;
  const saved = useMemo(() => (block ? draftOfBlock(block) : blankDraft()), [block]);
  const live = draft ?? saved;

  const savedOutline = useMemo(() => parseTerritory(block?.boundary ?? ''), [block?.boundary]);

  /* No block yet means this is the first one, so the drawing opens on the seed with the outline
     editor already on — there is nothing to pick trees on until a shape exists. */
  const creating = savedOutline.length < 3;
  const outline = shape ?? (creating ? seed : savedOutline);

  /* Taken off the stored shape on purpose. The projection's fixed point has to hold still while a
     corner moves, or following the centroid would slide every other coordinate with it. */
  const origin = useMemo(() => {
    const base = savedOutline.length > 0 ? savedOutline : seed;
    return base.length > 0 ? centroidOf(base) : { lat: 0, lng: 0 };
  }, [savedOutline, seed]);

  const plan = useOrchardPlan(outline, live, total);

  /* The spacings written back are the ones the plan settled on, not the ones typed: a plan that had
     to open up to fit the orchard's own trees is what the drawing shows, so it is what is saved. */
  async function save() {
    if (!orchard || outline.length < 3) return;

    setSaving(true);
    try {
      await onSave(
        {
          treeStockId: orchard.id,
          boundary: serializeTerritory(outline),
          pattern: live.pattern,
          treeSpacing: plan.treeSpacing,
          rowSpacing: plan.rowSpacing,
          rotation: Number(live.rotation) || 0,
          treeCount: plan.trees.length,
        },
        block
      );
      setDraft(null);
      setShape(null);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return {
    total,
    live,
    setDraft,
    outline,
    setShape,
    origin,
    plan,
    creating,
    /* Creating counts as dirty from the first render: the seed is a suggestion, and it has to be
       savable without nudging something first. */
    dirty: creating || shape != null || !sameDraft(live, saved),
    editing: editing || creating,
    setEditing,
    saving,
    save,
  };
}
