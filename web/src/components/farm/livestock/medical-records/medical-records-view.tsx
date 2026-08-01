import { useEffect, useState } from 'react';

// The stylesheet for every part of this view, loaded once here rather than by each part.
import '@/components/farm/record-list.css';
import { useLanguage } from '@/contexts/language-context';
import { createMedicalRecord, deleteMedicalRecord, getMedicalRecords } from '@/services/medical-record-service';
import type { MedicalRecord } from '@/types/medical-record';
import { MedicalRecordCard } from './medical-record-card';
import { buildMedicalRecordInput, isFormComplete, makeEmptyForm, type MedicalRecordForm } from './medical-record-form';
import { MedicalRecordFormModal } from './medical-record-form-modal';

type Props = {
  /** The animal (LivestockDetail) whose medical records these are. */
  stockId: number;
};

/**
 * Medical-record history for a single animal: vet visits with diagnosis, treatment, vitals, and
 * follow-up details, plus an "add new record" button.
 *
 * Owns the state and the server calls; the card and the form are in this folder, and the rules
 * for what each one shows are in the modules beside them.
 */
export function MedicalRecordsView({ stockId }: Props) {
  const { t } = useLanguage();

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState<MedicalRecordForm>(makeEmptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!stockId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRecords(await getMedicalRecords(stockId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setForm(makeEmptyForm());
    setFormError(null);
    setAddOpen(true);
  }

  async function handleAdd() {
    if (saving || !isFormComplete(form)) return;
    const input = buildMedicalRecordInput(form, stockId);
    if (!input) return;

    setSaving(true);
    setFormError(null);
    try {
      const created = await createMedicalRecord(input);
      setRecords((prev) => [...prev, created]);
      setAddOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('medicalRecord.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteMedicalRecord(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (loading) {
    return <div className="state-box">…</div>;
  }

  // Records come back ordered oldest→newest; show the most recent visit first.
  const newestFirst = [...records].reverse();

  return (
    <>
      {records.length === 0 ? (
        <p className="empty-state">{t('medicalRecord.empty')}</p>
      ) : (
        <div className="record-list">
          {newestFirst.map((record) => (
            <MedicalRecordCard key={record.id} record={record} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {error && <div className="error-banner">{t('medicalRecord.loadError')}</div>}

      <button type="button" className="add-button" onClick={openAdd}>
        + {t('medicalRecord.addRecord')}
      </button>

      <MedicalRecordFormModal
        open={addOpen}
        form={form}
        onFormChange={setForm}
        saving={saving}
        error={formError}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
      />
    </>
  );
}
