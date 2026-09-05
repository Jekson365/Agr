import { useState } from 'react';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import { HarvestResultFormModal } from '@/components/harvest/harvest-result-form-modal';
import { useLanguage } from '@/contexts/language-context';
import { deleteHarvestResult } from '@/services/harvest-result-service';
import type { HarvestItem } from '@/types/harvest-item';
import type { HarvestResult } from '@/types/harvest-result';
import { HarvestEntryList, type EntryRow } from './harvest-entry-list';
import { targetFor, type Catalogs } from './harvest-detail-lookups';

type Props = {
  harvestId: number;
  results: HarvestResult[];
  items: HarvestItem[];
  catalogs: Catalogs;
  /** Results belong to a finished harvest; before that the section explains itself instead. */
  canEdit: boolean;
  onChanged: (next: HarvestResult[]) => void;
};

export function ResultSection({ harvestId, results, items, catalogs, canEdit, onChanged }: Props) {
  const { t } = useLanguage();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HarvestResult | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; label: string } | null>(null);

  const canAdd = results.length === 0;

  const rows: EntryRow[] = results.map((result) => {
    const target = targetFor(catalogs, result.stockId, result.treeStockId, t);
    return {
      id: result.id,
      icon: target?.icon ?? '',
      title: target?.label ?? '',
      amount: `${result.amount} ${target?.unitLabel ?? ''}`,
      removed: target?.isDeleted ?? false,
    };
  });

  async function handleDelete() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteHarvestResult(id);
      onChanged(results.filter((r) => r.id !== id));
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <>
      <HarvestEntryList
        title={t('harvestResult.title')}
        rows={rows}
        emptyText={canEdit ? t('harvestResult.empty') : t('harvestResult.needsHarvested')}
        addLabel={t('harvestResult.add')}
        canEdit={canEdit}
        canAdd={canAdd}
        capText={t('harvestResult.onlyOne')}
        scrollable
        onAdd={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        onEdit={(id) => {
          setEditing(results.find((r) => r.id === id) ?? null);
          setFormOpen(true);
        }}
        onDelete={(id) => setConfirmDelete({ id, label: rows.find((r) => r.id === id)?.title ?? '' })}
      />

      <HarvestResultFormModal
        open={formOpen}
        harvestId={harvestId}
        editingResult={editing}
        plannedItems={items}
        onClose={() => setFormOpen(false)}
        onSaved={(saved, isNew) =>
          onChanged(isNew ? [...results, saved] : results.map((r) => (r.id === saved.id ? saved : r)))
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
