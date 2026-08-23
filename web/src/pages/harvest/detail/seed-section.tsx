import { useState } from 'react';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import { HarvestSeedFormModal } from '@/components/harvest/harvest-seed-form-modal';
import { useLanguage } from '@/contexts/language-context';
import { deleteHarvestSeed } from '@/services/harvest-seed-service';
import type { HarvestSeed } from '@/types/harvest-seed';
import { HarvestEntryList, type EntryRow } from './harvest-entry-list';
import { seedInfoFor, type Catalogs } from './harvest-detail-lookups';

type Props = {
  harvestId: number;
  harvestSeeds: HarvestSeed[];
  catalogs: Catalogs;
  canEdit: boolean;
  onChanged: (next: HarvestSeed[]) => void;
  onSeedsChanged: () => void;
};

export function SeedSection({ harvestId, harvestSeeds, catalogs, canEdit, onChanged, onSeedsChanged }: Props) {
  const { t } = useLanguage();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HarvestSeed | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; label: string } | null>(null);

  const rows: EntryRow[] = harvestSeeds.map((used) => {
    const info = seedInfoFor(catalogs, used.seedId, t);
    return {
      id: used.id,
      icon: info?.icon ?? '',
      title: info?.label ?? '',
      amount: `${used.amount} ${info?.unitLabel ?? ''}`,
      removed: info?.isDeleted ?? false,
    };
  });

  function openEdit(id: number) {
    setEditing(harvestSeeds.find((s) => s.id === id) ?? null);
    setFormOpen(true);
  }

  // Seed amounts on hand changed, so the seed catalog is reloaded rather than patched by hand.
  function handleSaved(saved: HarvestSeed, isNew: boolean) {
    onChanged(isNew ? [...harvestSeeds, saved] : harvestSeeds.map((s) => (s.id === saved.id ? saved : s)));
    onSeedsChanged();
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteHarvestSeed(id);
      onChanged(harvestSeeds.filter((s) => s.id !== id));
      onSeedsChanged();
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <>
      <HarvestEntryList
        title={t('harvestSeed.title')}
        rows={rows}
        emptyText={canEdit ? t('harvestSeed.empty') : t('harvestSeed.planningOnly')}
        addLabel={t('harvestSeed.add')}
        canEdit={canEdit}
        scrollable
        onAdd={() => {
          setEditing(null);
          setFormOpen(true);
        }}
        onEdit={openEdit}
        onDelete={(id) => setConfirmDelete({ id, label: rows.find((r) => r.id === id)?.title ?? '' })}
      />

      <HarvestSeedFormModal
        open={formOpen}
        harvestId={harvestId}
        editingSeed={editing}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.label ?? ''}
        body={t('harvestSeed.deleteBody')}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
