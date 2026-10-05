import { useCallback, useEffect, useState } from 'react';

import workIcon from '@/assets/icons/cellar-work.svg';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { round2, WINE_OPERATION_LABEL_KEY } from '@/config/wine';
import { useLanguage } from '@/contexts/language-context';
import { HarvestEntryList, type EntryRow } from '@/pages/harvest/detail/harvest-entry-list';
import { deleteWineOperation, getWineOperations } from '@/services/wine-operation-service';
import type { WineBatchSummary, WineOperation } from '@/types/wine';
import { WineOperationFormModal } from './wine-operation-form-modal';

type Props = {
  batch: WineBatchSummary;
  onChanged: () => void;
};

export function WineWorkSection({ batch, onChanged }: Props) {
  const { t, language } = useLanguage();

  const [operations, setOperations] = useState<WineOperation[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WineOperation | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; label: string } | null>(null);

  const load = useCallback(async () => {
    setOperations(await getWineOperations(batch.id));
  }, [batch.id]);

  useEffect(() => {
    load().catch(() => setOperations([]));
  }, [load]);

  async function reload() {
    await load();
    onChanged();
  }

  const rows: EntryRow[] = operations.map((operation) => ({
    id: operation.id,
    icon: workIcon,
    title: `${formatLocalizedIsoDate(operation.date, language)} · ${t(WINE_OPERATION_LABEL_KEY[operation.kind])}`,
    amount: [
      operation.note,
      operation.cost != null ? `₾${round2(operation.cost)}` : null,
      operation.litersLost ? `−${round2(operation.litersLost)} ${t('wine.unitLiter')}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    removed: false,
  }));

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await deleteWineOperation(confirmDelete.id);
      await reload();
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <>
      <HarvestEntryList
        title={t('wine.workTitle')}
        note={t('wine.workHint')}
        rows={rows}
        emptyText={t('wine.workEmpty')}
        addLabel={t('wine.workAdd')}
        canEdit={!batch.isDeleted}
        scrollable
        onAdd={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        onEdit={(id) => {
          setEditing(operations.find((operation) => operation.id === id) ?? null);
          setFormOpen(true);
        }}
        onDelete={(id) => setConfirmDelete({ id, label: rows.find((row) => row.id === id)?.title ?? '' })}
      />

      <WineOperationFormModal
        open={formOpen}
        batchId={batch.id}
        litersInCellar={batch.liters}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={reload}
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
