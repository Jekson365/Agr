import { useState } from 'react';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import { HarvestSeedFormModal } from '@/components/harvest/harvest-seed-form-modal';
import { SEED_UNIT_LABEL_KEY, seedTitle } from '@/config/seed-kinds';
import { stockKindImage } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createHarvestSeed, deleteHarvestSeed } from '@/services/harvest-seed-service';
import type { HarvestSeed } from '@/types/harvest-seed';
import { HarvestEntryList, type EntryRow } from './harvest-entry-list';
import { HarvestInlineAdd } from './harvest-inline-add';
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

  const [adding, setAdding] = useState(false);
  const [seedId, setSeedId] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const canAdd = harvestSeeds.length === 0;
  const available = catalogs.seeds.filter((seed) => !seed.isDeleted);
  const options = available.map((seed) => ({
    value: String(seed.id),
    label: seedTitle(seed, t),
    icon: stockKindImage(seed.type),
  }));

  const picked = available.find((seed) => String(seed.id) === seedId) ?? null;
  const amount = parseFloat(amountInput) || 0;
  const overAvailable = picked != null && amount > picked.amount;
  const canSave = picked != null && amount > 0 && !overAvailable && !saving;

  function startAdd() {
    setSeedId(String(available[0]?.id ?? ''));
    setAmountInput('');
    setAddError(null);
    setAdding(true);
  }

  async function saveAdd() {
    if (!canSave || !picked) return;
    setSaving(true);
    setAddError(null);
    try {
      const created = await createHarvestSeed({ harvestId, seedId: picked.id, amount });
      onChanged([...harvestSeeds, created]);
      onSeedsChanged();
      setAdding(false);
    } catch (err) {
      setAddError(err instanceof ApiError && err.status === 409 ? t('harvestSeed.onlyOne') : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

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
        canAdd={canAdd}
        capText={t('harvestSeed.onlyOne')}
        scrollable
        addForm={
          adding ? (
            <HarvestInlineAdd
              options={options}
              value={seedId}
              onValue={setSeedId}
              amount={amountInput}
              onAmount={setAmountInput}
              unitLabel={picked ? t(SEED_UNIT_LABEL_KEY[picked.unit] ?? '') : ''}
              hint={
                picked
                  ? t('seed.onHand', {
                      amount: picked.amount,
                      unit: t(SEED_UNIT_LABEL_KEY[picked.unit] ?? ''),
                    })
                  : null
              }
              error={addError}
              emptyText={t('harvestSeed.noSeeds')}
              saving={saving}
              canSave={canSave}
              onSave={saveAdd}
              onCancel={() => setAdding(false)}
            />
          ) : null
        }
        onAdd={startAdd}
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
