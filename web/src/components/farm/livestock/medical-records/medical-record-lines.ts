import { formatLocalizedIsoDate, type DateLanguage } from '@/components/ui/date-utils';
import type { MedicalRecord } from '@/types/medical-record';

/** The shape of `t` from the language context, so this stays a plain function rather than a hook. */
export type Translate = (key: string, params?: Record<string, string | number>) => string;

/**
 * The detail lines a record shows, in order — a visit only carries some of what the form can
 * record, so the card is whatever it actually holds. Related fields share a line (a medication
 * with its dose and route, the vitals together) rather than each getting one of their own.
 */
export function buildRecordLines(record: MedicalRecord, t: Translate, language: DateLanguage): string[] {
  const lines: string[] = [];

  if (record.diagnosis) {
    lines.push(`${t('medicalRecord.diagnosis')}: ${record.diagnosis}`);
  }
  if (record.symptoms) {
    lines.push(`${t('medicalRecord.symptoms')}: ${record.symptoms}`);
  }
  if (record.treatment) {
    lines.push(`${t('medicalRecord.treatment')}: ${record.treatment}`);
  }
  if (record.medication) {
    const dosage = record.dosage ? ` (${record.dosage})` : '';
    const route = record.route ? `, ${record.route}` : '';
    lines.push(`${t('medicalRecord.medication')}: ${record.medication}${dosage}${route}`);
  }
  if (record.durationDays != null) {
    lines.push(`${t('medicalRecord.durationDays')}: ${record.durationDays}`);
  }
  if (record.clinicName || record.veterinarianId != null) {
    const clinic = record.clinicName ?? '';
    const separator = record.clinicName && record.veterinarianId != null ? ' · ' : '';
    const vet = record.veterinarianId != null ? `${t('medicalRecord.veterinarianId')}: ${record.veterinarianId}` : '';
    lines.push(`${clinic}${separator}${vet}`);
  }

  const vitals = [
    record.temperature != null ? `${record.temperature}°C` : null,
    record.weight != null ? `${record.weight}kg` : null,
    record.heartRate != null ? `${record.heartRate}bpm` : null,
    record.respiratoryRate != null ? `${record.respiratoryRate}/min` : null,
  ].filter(Boolean);
  if (vitals.length > 0) {
    lines.push(vitals.join(' · '));
  }

  if (record.followUpDate) {
    lines.push(`${t('medicalRecord.followUpDate')}: ${formatLocalizedIsoDate(record.followUpDate, language)}`);
  }
  if (record.cost != null || record.outcome) {
    const cost = record.cost != null ? `${t('medicalRecord.cost')}: ${record.cost}` : '';
    const separator = record.cost != null && record.outcome ? ' · ' : '';
    const outcome = record.outcome ? `${t('medicalRecord.outcome')}: ${record.outcome}` : '';
    lines.push(`${cost}${separator}${outcome}`);
  }
  if (record.notes) {
    // The note stands on its own — it is already prose, so labelling it would only add noise.
    lines.push(record.notes);
  }

  return lines;
}
