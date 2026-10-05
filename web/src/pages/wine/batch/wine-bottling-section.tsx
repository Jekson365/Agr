import { useCallback, useEffect, useState } from 'react';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { round2 } from '@/config/wine';
import { bottleIconFor } from '@/config/wine-bottles';
import { useLanguage } from '@/contexts/language-context';
import { HarvestEntryList, type EntryRow } from '@/pages/harvest/detail/harvest-entry-list';
import { ApiError } from '@/services/api-client';
import { deleteWineBottling, getWineBottlings } from '@/services/wine-bottling-service';
import type { WineBatchSummary, WineBottling } from '@/types/wine';
import { WineBottlingFormModal } from './wine-bottling-form-modal';

type Props = {
  batch: WineBatchSummary;
  onChanged: () => void;
};

export function WineBottlingSection({ batch, onChanged }: Props) {
  const { t, language } = useLanguage();

  const [bottlings, setBottlings] = useState<WineBottling[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WineBottling | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setBottlings(await getWineBottlings(batch.id));
  }, [batch.id]);

  useEffect(() => {
    load().catch(() => setBottlings([]));
  }, [load]);

  async function reload() {
    await load();
    onChanged();
  }

  const rows: EntryRow[] = bottlings.map((bottling) => ({
    id: bottling.id,
    icon: bottleIconFor(bottling.bottleSize),
    title: [formatLocalizedIsoDate(bottling.date, language), bottling.lot ? `${t('wine.lotShort')} ${bottling.lot}` : null]
      .filter(Boolean)
      .join(' · '),
    amount:
      `${bottling.count} × ${bottling.bottleSize} ${t('wine.unitLiter')} = ${round2(bottling.count * bottling.bottleSize)} ${t('wine.unitLiter')}` +
      (bottling.cost != null ? ` · ₾${round2(bottling.cost)}` : ''),
    removed: false,
  }));

  async function handleDelete() {
    if (!confirmDelete) return;
    setError(null);
    try {
      await deleteWineBottling(confirmDelete.id);
      await reload();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? t('wine.bottlingSold') : t('farm.saveError'));
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <>
      {error && <div className="error-banner">{error}</div>}
      <HarvestEntryList
        title={t('wine.bottlingTitle')}
        note={t('wine.bottlingHint')}
        rows={rows}
        emptyText={t('wine.bottlingEmpty')}
        addLabel={t('wine.bottlingAdd')}
        canEdit={!batch.isDeleted}
        onAdd={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        onEdit={(id) => {
          setEditing(bottlings.find((bottling) => bottling.id === id) ?? null);
          setFormOpen(true);
        }}
        onDelete={(id) => setConfirmDelete({ id, label: rows.find((row) => row.id === id)?.title ?? '' })}
      />

      <WineBottlingFormModal
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
