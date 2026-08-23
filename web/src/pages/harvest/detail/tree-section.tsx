import { useState } from 'react';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import { HarvestTreeFormModal } from '@/components/harvest/harvest-tree-form-modal';
import { useLanguage } from '@/contexts/language-context';
import { deleteHarvestTree } from '@/services/harvest-tree-service';
import type { HarvestTree } from '@/types/harvest-tree';
import { HarvestEntryList, type EntryRow } from './harvest-entry-list';
import { treeInfoFor, type Catalogs } from './harvest-detail-lookups';

type Props = {
  harvestId: number;
  harvestTrees: HarvestTree[];
  catalogs: Catalogs;
  onChanged: (next: HarvestTree[]) => void;
};

/** Which orchards were picked — fruit harvests only. Editable in any status: unlike sowing,
 *  picking happens at harvest time, so it is usually recorded once done. */
export function TreeSection({ harvestId, harvestTrees, catalogs, onChanged }: Props) {
  const { t } = useLanguage();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HarvestTree | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; label: string } | null>(null);

  const rows: EntryRow[] = harvestTrees.map((picked) => {
    const info = treeInfoFor(catalogs, picked.treeStockId, t);
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
        title={t('harvestTree.title')}
        rows={rows}
        emptyText={t('harvestTree.empty')}
        addLabel={t('harvestTree.add')}
        canEdit
        scrollable
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
        harvestId={harvestId}
        editingTree={editing}
        existingTrees={harvestTrees}
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
