import { useState } from 'react';

import grapeIcon from '@/assets/goods/grape.png';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import { round2 } from '@/config/wine';
import { useLanguage } from '@/contexts/language-context';
import { AmountField } from '@/pages/harvest/detail/amount-field';
import { HarvestEntryList, type EntryRow } from '@/pages/harvest/detail/harvest-entry-list';
import { setProducedLiters } from '@/services/wine-batch-service';
import { deleteWineGrape, updateWineGrape } from '@/services/wine-grape-service';
import type { WineBatchDetail } from './use-wine-batch';
import { WineGrapeFormModal } from './wine-grape-form-modal';

type Props = {
  detail: WineBatchDetail;
};

export function WineGrapesSection({ detail }: Props) {
  const { t } = useLanguage();
  const { batch, grapes, grapeOptions } = detail;

  const [formOpen, setFormOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; label: string } | null>(null);

  if (!batch) return null;

  const rows: EntryRow[] = grapes.map((grape) => {
    const option = grapeOptions.find((item) => item.treeProductId === grape.treeProductId);
    return {
      id: grape.id,
      icon: grapeIcon,
      title: option?.label ?? '',
      amount: option ? t('wine.grapesAvailable', { amount: option.available }) : '',
      removed: option?.isDeleted ?? false,
    };
  });

  function askDelete(id: number) {
    setConfirmDelete({ id, label: rows.find((row) => row.id === id)?.title ?? '' });
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await deleteWineGrape(confirmDelete.id);
      await detail.refresh();
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <>
      <HarvestEntryList
        title={t('wine.grapesTitle')}
        note={t('wine.grapesHint')}
        rows={rows}
        emptyText={t('wine.grapesEmpty')}
        addLabel={t('wine.grapesAdd')}
        canEdit={!batch.isDeleted}
        rowActions={(id) => {
          const grape = grapes.find((row) => row.id === id);
          if (!grape) return null;
          return (
            <>
              <AmountField
                caption={t('farm.amount')}
                amount={grape.amount}
                unitLabel={t('farm.unitKg')}
                disabled={batch.isDeleted}
                onSave={async (amount) => {
                  await updateWineGrape({ ...grape, amount });
                  await detail.refresh();
                }}
              />
              {!batch.isDeleted && (
                <button type="button" className="hd-button danger" onClick={() => askDelete(id)}>
                  {t('common.delete')}
                </button>
              )}
            </>
          );
        }}
        onAdd={() => setFormOpen(true)}
        onDelete={askDelete}
      />

      {batch.stage === 'Bottled' && (
        <div className="wine-result">
          <AmountField
            caption={t('wine.produced')}
            amount={round2(batch.producedLiters)}
            unitLabel={t('wine.unitLiter')}
            disabled={batch.isDeleted}
            onSave={async (liters) => {
              await setProducedLiters(batch.id, liters);
              await detail.refresh();
            }}
          />
          {batch.producedLiters > 0 && (
            <span className={batch.liters > 0 ? 'limit-hint listing-quantity-over' : 'limit-hint'}>
              {batch.liters > 0 ? t('wine.toBottle', { liters: round2(batch.liters) }) : t('wine.fullyBottled')}
            </span>
          )}
        </div>
      )}

      <WineGrapeFormModal
        open={formOpen}
        batchId={batch.id}
        used={grapes}
        options={grapeOptions}
        onClose={() => setFormOpen(false)}
        onSaved={detail.refresh}
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
