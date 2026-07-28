import { useEffect, useState } from 'react';

import '@/components/farm/record-list.css';
import { formatLocalizedIsoDate, todayIsoDate } from '@/components/ui/date-utils';
import { DateField } from '@/components/ui/date-field';
import { useLanguage } from '@/contexts/language-context';
import { createMedicalRecord, deleteMedicalRecord, getMedicalRecords } from '@/services/medical-record-service';
import type { MedicalRecord } from '@/types/medical-record';

type Props = {
  /** The animal (LivestockDetail) whose medical records these are. */
  stockId: number;
};


const EMPTY_FORM = {
  recordType: '',
  visitDate: todayIsoDate() as string | null,
  diagnosis: '',
  symptoms: '',
  treatment: '',
  medication: '',
  dosage: '',
  route: '',
  durationDays: '',
  veterinarianId: '',
  clinicName: '',
  temperature: '',
  weight: '',
  heartRate: '',
  respiratoryRate: '',
  followUpDate: null as string | null,
  cost: '',
  outcome: '',
  notes: '',
};

function parseIntOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseFloatOrNull(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = parseFloat(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

/**
 * Medical-record history for a single animal: vet visits with diagnosis, treatment,
 * vitals, and follow-up details, plus an "add new record" button.
 */
export function MedicalRecordsView({ stockId }: Props) {
  const { t, language } = useLanguage();

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
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

  function setField<K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canSubmit = form.recordType.trim().length > 0 && !!form.visitDate && !saving;

  function openAdd() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setAddOpen(true);
  }

  async function handleAdd() {
    const recordType = form.recordType.trim();
    if (!recordType || !form.visitDate) return;

    setSaving(true);
    setFormError(null);
    try {
      const created = await createMedicalRecord({
        stockId,
        visitDate: form.visitDate,
        recordType,
        diagnosis: form.diagnosis.trim() || null,
        symptoms: form.symptoms.trim() || null,
        treatment: form.treatment.trim() || null,
        medication: form.medication.trim() || null,
        dosage: form.dosage.trim() || null,
        route: form.route.trim() || null,
        durationDays: parseIntOrNull(form.durationDays),
        veterinarianId: parseIntOrNull(form.veterinarianId),
        clinicName: form.clinicName.trim() || null,
        temperature: parseFloatOrNull(form.temperature),
        weight: parseFloatOrNull(form.weight),
        heartRate: parseIntOrNull(form.heartRate),
        respiratoryRate: parseIntOrNull(form.respiratoryRate),
        followUpDate: form.followUpDate,
        cost: parseFloatOrNull(form.cost),
        outcome: form.outcome.trim() || null,
        notes: form.notes.trim() || null,
      });
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
            <div key={record.id} className="record-card">
              <div className="record-card-main">
                <div className="record-card-header">
                  <span className="record-card-date">{formatLocalizedIsoDate(record.visitDate, language)}</span>
                  <span className="record-card-title">{record.recordType}</span>
                </div>

                {record.diagnosis && (
                  <p className="record-card-line">
                    {t('medicalRecord.diagnosis')}: {record.diagnosis}
                  </p>
                )}
                {record.symptoms && (
                  <p className="record-card-line">
                    {t('medicalRecord.symptoms')}: {record.symptoms}
                  </p>
                )}
                {record.treatment && (
                  <p className="record-card-line">
                    {t('medicalRecord.treatment')}: {record.treatment}
                  </p>
                )}
                {record.medication && (
                  <p className="record-card-line">
                    {t('medicalRecord.medication')}: {record.medication}
                    {record.dosage ? ` (${record.dosage})` : ''}
                    {record.route ? `, ${record.route}` : ''}
                  </p>
                )}
                {record.durationDays != null && (
                  <p className="record-card-line">
                    {t('medicalRecord.durationDays')}: {record.durationDays}
                  </p>
                )}
                {(record.clinicName || record.veterinarianId != null) && (
                  <p className="record-card-line">
                    {record.clinicName ?? ''}
                    {record.clinicName && record.veterinarianId != null ? ' · ' : ''}
                    {record.veterinarianId != null ? `${t('medicalRecord.veterinarianId')}: ${record.veterinarianId}` : ''}
                  </p>
                )}
                {(record.temperature != null || record.weight != null || record.heartRate != null || record.respiratoryRate != null) && (
                  <p className="record-card-line">
                    {[
                      record.temperature != null ? `${record.temperature}°C` : null,
                      record.weight != null ? `${record.weight}kg` : null,
                      record.heartRate != null ? `${record.heartRate}bpm` : null,
                      record.respiratoryRate != null ? `${record.respiratoryRate}/min` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}
                {record.followUpDate && (
                  <p className="record-card-line">
                    {t('medicalRecord.followUpDate')}: {formatLocalizedIsoDate(record.followUpDate, language)}
                  </p>
                )}
                {(record.cost != null || record.outcome) && (
                  <p className="record-card-line">
                    {record.cost != null ? `${t('medicalRecord.cost')}: ${record.cost}` : ''}
                    {record.cost != null && record.outcome ? ' · ' : ''}
                    {record.outcome ? `${t('medicalRecord.outcome')}: ${record.outcome}` : ''}
                  </p>
                )}
                {record.notes && <p className="record-card-line">{record.notes}</p>}
              </div>
              <button type="button" className="record-card-delete" onClick={() => handleDelete(record.id)} aria-label={t('common.delete')}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <div className="error-banner">{t('medicalRecord.loadError')}</div>}

      <button type="button" className="add-button" onClick={openAdd}>
        + {t('medicalRecord.addRecord')}
      </button>

      {addOpen && (
        <div className="modal-overlay" onClick={() => setAddOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="form-title">{t('medicalRecord.addRecord')}</h2>

            <div className="form-fields">
              <div className="field">
                <label>{t('medicalRecord.recordType')}</label>
                <input
                  value={form.recordType}
                  onChange={(e) => setField('recordType', e.target.value)}
                  placeholder={t('medicalRecord.recordTypePlaceholder')}
                  autoFocus
                />
              </div>

              <div className="field">
                <label>{t('medicalRecord.visitDate')}</label>
                <DateField value={form.visitDate} max={todayIsoDate()} onChange={(v) => setField('visitDate', v)} />
              </div>

              <div className="field">
                <label>{t('medicalRecord.diagnosis')}</label>
                <input
                  value={form.diagnosis}
                  onChange={(e) => setField('diagnosis', e.target.value)}
                  placeholder={t('medicalRecord.diagnosisPlaceholder')}
                />
              </div>

              <div className="field">
                <label>{t('medicalRecord.symptoms')}</label>
                <input
                  value={form.symptoms}
                  onChange={(e) => setField('symptoms', e.target.value)}
                  placeholder={t('medicalRecord.symptomsPlaceholder')}
                />
              </div>

              <div className="field">
                <label>{t('medicalRecord.treatment')}</label>
                <input
                  value={form.treatment}
                  onChange={(e) => setField('treatment', e.target.value)}
                  placeholder={t('medicalRecord.treatmentPlaceholder')}
                />
              </div>

              <div className="field">
                <label>{t('medicalRecord.medication')}</label>
                <input
                  value={form.medication}
                  onChange={(e) => setField('medication', e.target.value)}
                  placeholder={t('medicalRecord.medicationPlaceholder')}
                />
              </div>

              <div className="field">
                <label>{t('medicalRecord.dosage')}</label>
                <input
                  value={form.dosage}
                  onChange={(e) => setField('dosage', e.target.value)}
                  placeholder={t('medicalRecord.dosagePlaceholder')}
                />
              </div>

              <div className="field">
                <label>{t('medicalRecord.route')}</label>
                <input
                  value={form.route}
                  onChange={(e) => setField('route', e.target.value)}
                  placeholder={t('medicalRecord.routePlaceholder')}
                />
              </div>

              <div className="field">
                <label>{t('medicalRecord.durationDays')}</label>
                <input value={form.durationDays} onChange={(e) => setField('durationDays', e.target.value)} inputMode="numeric" />
              </div>

              <div className="field">
                <label>{t('medicalRecord.veterinarianId')}</label>
                <input value={form.veterinarianId} onChange={(e) => setField('veterinarianId', e.target.value)} inputMode="numeric" />
              </div>

              <div className="field">
                <label>{t('medicalRecord.clinicName')}</label>
                <input value={form.clinicName} onChange={(e) => setField('clinicName', e.target.value)} />
              </div>

              <div className="field">
                <label>{t('medicalRecord.temperature')}</label>
                <input value={form.temperature} onChange={(e) => setField('temperature', e.target.value)} inputMode="decimal" />
              </div>

              <div className="field">
                <label>{t('medicalRecord.weight')}</label>
                <input value={form.weight} onChange={(e) => setField('weight', e.target.value)} inputMode="decimal" />
              </div>

              <div className="field">
                <label>{t('medicalRecord.heartRate')}</label>
                <input value={form.heartRate} onChange={(e) => setField('heartRate', e.target.value)} inputMode="numeric" />
              </div>

              <div className="field">
                <label>{t('medicalRecord.respiratoryRate')}</label>
                <input value={form.respiratoryRate} onChange={(e) => setField('respiratoryRate', e.target.value)} inputMode="numeric" />
              </div>

              <div className="field">
                <label>{t('medicalRecord.followUpDate')}</label>
                <DateField value={form.followUpDate} onChange={(v) => setField('followUpDate', v)} />
              </div>

              <div className="field">
                <label>{t('medicalRecord.cost')}</label>
                <input value={form.cost} onChange={(e) => setField('cost', e.target.value)} inputMode="decimal" />
              </div>

              <div className="field">
                <label>{t('medicalRecord.outcome')}</label>
                <input
                  value={form.outcome}
                  onChange={(e) => setField('outcome', e.target.value)}
                  placeholder={t('medicalRecord.outcomePlaceholder')}
                />
              </div>

              <div className="field">
                <label>{t('medicalRecord.notes')}</label>
                <input
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  placeholder={t('medicalRecord.notesPlaceholder')}
                />
              </div>

              {formError && <div className="error-banner">{formError}</div>}
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setAddOpen(false)}>
                {t('common.cancel')}
              </button>
              <button type="button" className="btn" onClick={handleAdd} disabled={!canSubmit}>
                {t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
