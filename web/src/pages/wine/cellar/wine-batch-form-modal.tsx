import { useEffect, useState } from 'react';

import { todayIsoDate } from '@/components/ui/date-utils';
import { Modal } from '@/components/ui/modal';
import { LITERS_PER_KG, parseAmount, round2 } from '@/config/wine';
import { useLanguage } from '@/contexts/language-context';
import { loadGrapeOptions, type GrapeOption } from '@/pages/wine/wine-grape-options';
import { ApiError } from '@/services/api-client';
import { createWineBatch, updateWineBatch } from '@/services/wine-batch-service';
import type { WineBatchSummary } from '@/types/wine';
import { WineBatchFields, type WineBatchDraft } from './wine-batch-fields';
import { WineGrapePicker } from './wine-grape-picker';

type Props = {
  open: boolean;
  editing: WineBatchSummary | null;
  onClose: () => void;
  onSaved: (batch: WineBatchSummary, isNew: boolean) => void;
};

const blankDraft = (): WineBatchDraft => ({
  name: '',
  vintage: String(new Date().getFullYear()),
  startDate: todayIsoDate(),
  notes: '',
});

export function WineBatchFormModal({ open, editing, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [draft, setDraft] = useState<WineBatchDraft>(blankDraft);
  const [options, setOptions] = useState<GrapeOption[]>([]);
  const [grapeId, setGrapeId] = useState<number | null>(null);
  const [grapeAmount, setGrapeAmount] = useState('');
  const [liters, setLiters] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setGrapeId(null);
    setGrapeAmount('');
    setLiters(null);
    setDraft(
      editing
        ? {
            name: editing.name,
            vintage: String(editing.vintage),
            startDate: editing.startDate,
            notes: editing.notes ?? '',
          }
        : blankDraft()
    );
    if (!editing) loadGrapeOptions(t).then(setOptions).catch(() => setOptions([]));
  }, [open, editing, t]);

  const choices = options.filter((option) => !option.isDeleted && option.available > 0);
  const grape = choices.find((option) => option.treeProductId === grapeId) ?? choices[0] ?? null;
  const amount = grape ? parseAmount(grapeAmount) : 0;
  const over = grape != null && amount > grape.available;
  const totalKg = round2(amount);
  const suggested = round2(totalKg * LITERS_PER_KG);
  const litersText = liters ?? (totalKg > 0 ? String(suggested) : '');
  const vintage = parseInt(draft.vintage, 10);
  const valid = draft.name.trim() !== '' && vintage >= 1900 && vintage <= 2200 && !over;

  async function handleSubmit() {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    const fields = {
      name: draft.name.trim(),
      vintage,
      startDate: draft.startDate,
      notes: draft.notes.trim() || null,
    };
    try {
      if (editing) {
        await updateWineBatch({ ...editing, ...fields });
        onSaved({ ...editing, ...fields }, false);
      } else {
        const grapes = grape && amount > 0 ? [{ treeProductId: grape.treeProductId, amount }] : [];
        onSaved(await createWineBatch({ ...fields, liters: parseAmount(litersText), grapes }), true);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? t('wine.grapesOver') : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <h2 className="form-title">{editing ? t('wine.editBatch') : t('wine.addBatch')}</h2>
      <div className="form-fields">
        <WineBatchFields draft={draft} onChange={setDraft} />
        {!editing && (
          <WineGrapePicker
            choices={choices}
            selected={grape}
            onSelect={setGrapeId}
            amount={grapeAmount}
            onAmount={setGrapeAmount}
            over={over}
            liters={litersText}
            onLiters={setLiters}
            totalKg={totalKg}
            suggested={suggested}
          />
        )}
        {error && <div className="error-banner">{error}</div>}
      </div>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="button" className="btn" onClick={handleSubmit} disabled={!valid || saving}>
          {editing ? t('common.save') : t('common.add')}
        </button>
      </div>
    </Modal>
  );
}
