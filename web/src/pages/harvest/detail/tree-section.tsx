import { useState } from 'react';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import { pickKeyPrefix } from '@/components/harvest/harvest-pick-options';
import { HarvestTreeFormModal } from '@/components/harvest/harvest-tree-form-modal';
import { useLanguage } from '@/contexts/language-context';
import { deleteHarvestTree, updateHarvestTree } from '@/services/harvest-tree-service';
import type { HarvestKind } from '@/types/harvest';
import type { HarvestItem } from '@/types/harvest-item';
import type { HarvestTree } from '@/types/harvest-tree';
import { HarvestEntryList, type EntryRow } from './harvest-entry-list';
import { targetFor, treeInfoFor, type Catalogs } from './harvest-detail-lookups';
import { AmountField } from './amount-field';
import { saveWinePlan } from './wine-plan';

type Props = {
  kind: HarvestKind;
  harvestId: number;
  harvestTrees: HarvestTree[];
  catalogs: Catalogs;
  /** False once the harvest has booked its produce: editing a picking then would rewrite the
   *  product balance it wrote, and the server refuses it. */
  canEdit: boolean;
  /** True once the harvest is marked harvested: only then is what came off the trees known, so
   *  only then is the weight asked for. */
  canRecordHarvested: boolean;
  onChanged: (next: HarvestTree[]) => void;
  items: HarvestItem[];
  onItemsChanged: (next: HarvestItem[]) => void;
};

/** Which orchard was picked — fruit harvests only. One per harvest: its costs, revenue and
 *  grading all answer for that one orchard. Editable in any status: unlike sowing, picking happens
 *  at harvest time, so it is usually recorded once done. */
export function TreeSection({
  kind,
  harvestId,
  harvestTrees,
  catalogs,
  canEdit,
  canRecordHarvested,
  onChanged,
  items,
  onItemsChanged,
}: Props) {
  const { t } = useLanguage();
  const prefix = pickKeyPrefix(kind);
  const inlineResult = kind === 'Wine';

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HarvestTree | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; label: string } | null>(null);

  const rows: EntryRow[] = harvestTrees.map((picked) => {
    const info =
      picked.stockId != null
        ? targetFor(catalogs, picked.stockId, null, t)
        : treeInfoFor(catalogs, picked.treeStockId ?? 0, t);
    return {
      id: picked.id,
      icon: info?.icon ?? '',
      title: info?.label ?? '',
      amount: `${picked.amount} ${info?.unitLabel ?? ''}`,
      removed: info?.isDeleted ?? false,
    };
  });

  async function handleDelete() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteHarvestTree(id);
      onChanged(harvestTrees.filter((h) => h.id !== id));
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <>
      <HarvestEntryList
        title={t(`${prefix}.title`)}
        rows={rows}
        emptyText={t(`${prefix}.empty`)}
        addLabel={t(`${prefix}.add`)}
        canEdit={canEdit}
        canAdd={harvestTrees.length === 0}
        capText={t(`${prefix}.onlyOne`)}
        scrollable
        note={inlineResult && canEdit && !canRecordHarvested && harvestTrees.length > 0 ? t(`${prefix}.harvestedLater`) : undefined}
        rowActions={
          inlineResult
            ? (id) => {
                const tree = harvestTrees.find((h) => h.id === id);
                if (!tree || tree.stockId == null) return null;
                const stockId = tree.stockId;
                const plan = items.find((item) => item.stockId === stockId);
                return (
                  <>
                    <AmountField
                      caption={t('harvest.comparisonPlanned')}
                      amount={plan?.amount ?? 0}
                      unitLabel={t('farm.unitKg')}
                      disabled={!canEdit || canRecordHarvested}
                      onSave={async (amount) => onItemsChanged(await saveWinePlan(harvestId, stockId, plan, amount))}
                    />
                    <AmountField
                      caption={t('harvest.comparisonActual')}
                      amount={tree.harvestedAmount}
                      unitLabel={t('farm.unitKg')}
                      disabled={!canEdit || !canRecordHarvested}
                      onSave={async (harvestedAmount) => {
                        const saved: HarvestTree = { ...tree, harvestedAmount };
                        await updateHarvestTree(tree.id, saved);
                        onChanged(harvestTrees.map((h) => (h.id === saved.id ? saved : h)));
                      }}
                    />
                  </>
                );
              }
            : undefined
        }
        onAdd={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        onEdit={(id) => {
          setEditing(harvestTrees.find((h) => h.id === id) ?? null);
          setFormOpen(true);
        }}
        onDelete={(id) => setConfirmDelete({ id, label: rows.find((r) => r.id === id)?.title ?? '' })}
      />

      <HarvestTreeFormModal
        open={formOpen}
        kind={kind}
        harvestId={harvestId}
        editingTree={editing}
        existingTrees={harvestTrees}
        canRecordHarvested={canRecordHarvested}
        onClose={() => setFormOpen(false)}
        onSaved={(saved, isNew) =>
          onChanged(isNew ? [...harvestTrees, saved] : harvestTrees.map((h) => (h.id === saved.id ? saved : h)))
        }
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.label ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
