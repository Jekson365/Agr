import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { styles } from '@/components/farm/shared/styles';
import { DateField } from '@/components/ui/date-field';
import { toIsoDate } from '@/components/ui/date-utils';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import {
  createMedicalRecord,
  deleteMedicalRecord,
  getMedicalRecords,
} from '@/services/medical-record-service';
import type { MedicalRecord } from '@/types/medical-record';

type Props = {
  /** The animal (LivestockDetail) whose medical records these are. */
  stockId: number;
};

const EMPTY_FORM = {
  recordType: '',
  visitDate: toIsoDate(new Date()) as string | null,
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

/**
 * Medical-record history for a single animal: vet visits with diagnosis, treatment,
 * vitals, and follow-up details, plus an "add new record" button.
 */
export function MedicalRecordsView({ stockId }: Props) {
  const { t } = useLanguage();

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addVisible, setAddVisible] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!stockId) return;
    load(stockId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockId]);

  async function load(id: number) {
    setLoading(true);
    setError(null);
    try {
      setRecords(await getMedicalRecords(id));
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
    setError(null);
    setAddVisible(true);
  }

  async function handleAdd() {
    const recordType = form.recordType.trim();
    if (!recordType || !form.visitDate) return;

    setSaving(true);
    setError(null);
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
      setAddVisible(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
    return (
      <View style={styles.stateBox}>
        <ActivityIndicator color={Brand.dark} />
      </View>
    );
  }

  // Records come back ordered oldest→newest; show the most recent visit first.
  const newestFirst = [...records].reverse();

  return (
    <>
      {records.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{t('medicalRecord.empty')}</Text>
        </View>
      ) : (
        newestFirst.map((record) => (
          <View key={record.id} style={[styles.historyRow, styles.historyRowUp, recordStyles.row]}>
            <View style={styles.cardInfo}>
              <View style={recordStyles.header}>
                <Text style={styles.historyRowDate}>{formatDate(record.visitDate)}</Text>
                <Text style={styles.historyRowWeight}>{record.recordType}</Text>
              </View>

              {record.diagnosis ? (
                <Text style={recordStyles.line}>
                  {t('medicalRecord.diagnosis')}: {record.diagnosis}
                </Text>
              ) : null}
              {record.symptoms ? (
                <Text style={recordStyles.line}>
                  {t('medicalRecord.symptoms')}: {record.symptoms}
                </Text>
              ) : null}
              {record.treatment ? (
                <Text style={recordStyles.line}>
                  {t('medicalRecord.treatment')}: {record.treatment}
                </Text>
              ) : null}
              {record.medication ? (
                <Text style={recordStyles.line}>
                  {t('medicalRecord.medication')}: {record.medication}
                  {record.dosage ? ` (${record.dosage})` : ''}
                  {record.route ? `, ${record.route}` : ''}
                </Text>
              ) : null}
              {record.durationDays != null ? (
                <Text style={recordStyles.line}>
                  {t('medicalRecord.durationDays')}: {record.durationDays}
                </Text>
              ) : null}
              {record.clinicName || record.veterinarianId != null ? (
                <Text style={recordStyles.line}>
                  {record.clinicName ?? ''}
                  {record.clinicName && record.veterinarianId != null ? ' · ' : ''}
                  {record.veterinarianId != null ? `${t('medicalRecord.veterinarianId')}: ${record.veterinarianId}` : ''}
                </Text>
              ) : null}
              {record.temperature != null ||
              record.weight != null ||
              record.heartRate != null ||
              record.respiratoryRate != null ? (
                <Text style={recordStyles.line}>
                  {[
                    record.temperature != null ? `${record.temperature}°C` : null,
                    record.weight != null ? `${record.weight}kg` : null,
                    record.heartRate != null ? `${record.heartRate}bpm` : null,
                    record.respiratoryRate != null ? `${record.respiratoryRate}/min` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              ) : null}
              {record.followUpDate ? (
                <Text style={recordStyles.line}>
                  {t('medicalRecord.followUpDate')}: {formatDate(record.followUpDate)}
                </Text>
              ) : null}
              {record.cost != null || record.outcome ? (
                <Text style={recordStyles.line}>
                  {record.cost != null ? `${t('medicalRecord.cost')}: ${record.cost}` : ''}
                  {record.cost != null && record.outcome ? ' · ' : ''}
                  {record.outcome ? `${t('medicalRecord.outcome')}: ${record.outcome}` : ''}
                </Text>
              ) : null}
              {record.notes ? <Text style={recordStyles.line}>{record.notes}</Text> : null}
            </View>
            <Pressable
              hitSlop={8}
              onPress={() => handleDelete(record.id)}
              accessibilityRole="button"
              accessibilityLabel={t('common.delete')}>
              <Ionicons name="trash-outline" size={18} color={Brand.muted} />
            </Pressable>
          </View>
        ))
      )}

      {error ? <Text style={styles.errorText}>{t('medicalRecord.loadError')}</Text> : null}

      <Pressable style={styles.addButton} onPress={openAdd}>
        <Ionicons name="add" size={18} color={Brand.dark} />
        <Text style={styles.addButtonLabel}>{t('medicalRecord.addRecord')}</Text>
      </Pressable>

      <Modal visible={addVisible} transparent animationType="slide" onRequestClose={() => setAddVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.formOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAddVisible(false)} />
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{t('medicalRecord.addRecord')}</Text>

            <ScrollView style={styles.formScrollArea} showsVerticalScrollIndicator>
              <Text style={styles.fieldLabel}>{t('medicalRecord.recordType')}</Text>
              <TextInput
                style={styles.input}
                value={form.recordType}
                onChangeText={(v) => setField('recordType', v)}
                placeholder={t('medicalRecord.recordTypePlaceholder')}
                placeholderTextColor={Brand.muted}
                autoFocus
              />

              <Text style={styles.fieldLabel}>{t('medicalRecord.visitDate')}</Text>
              <DateField
                value={form.visitDate}
                onChange={(v) => setField('visitDate', v)}
                placeholder={t('medicalRecord.visitDatePlaceholder')}
                maximumDate={new Date()}
              />

              <Text style={styles.fieldLabel}>{t('medicalRecord.diagnosis')}</Text>
              <TextInput
                style={styles.input}
                value={form.diagnosis}
                onChangeText={(v) => setField('diagnosis', v)}
                placeholder={t('medicalRecord.diagnosisPlaceholder')}
                placeholderTextColor={Brand.muted}
              />

              <Text style={styles.fieldLabel}>{t('medicalRecord.symptoms')}</Text>
              <TextInput
                style={styles.input}
                value={form.symptoms}
                onChangeText={(v) => setField('symptoms', v)}
                placeholder={t('medicalRecord.symptomsPlaceholder')}
                placeholderTextColor={Brand.muted}
                multiline
              />

              <Text style={styles.fieldLabel}>{t('medicalRecord.treatment')}</Text>
              <TextInput
                style={styles.input}
                value={form.treatment}
                onChangeText={(v) => setField('treatment', v)}
                placeholder={t('medicalRecord.treatmentPlaceholder')}
                placeholderTextColor={Brand.muted}
                multiline
              />

              <View style={styles.formRow}>
                <View style={styles.formRowField}>
                  <Text style={styles.fieldLabel}>{t('medicalRecord.medication')}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.medication}
                    onChangeText={(v) => setField('medication', v)}
                    placeholder={t('medicalRecord.medicationPlaceholder')}
                    placeholderTextColor={Brand.muted}
                  />
                </View>
                <View style={styles.formRowField}>
                  <Text style={styles.fieldLabel}>{t('medicalRecord.dosage')}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.dosage}
                    onChangeText={(v) => setField('dosage', v)}
                    placeholder={t('medicalRecord.dosagePlaceholder')}
                    placeholderTextColor={Brand.muted}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formRowField}>
                  <Text style={styles.fieldLabel}>{t('medicalRecord.route')}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.route}
                    onChangeText={(v) => setField('route', v)}
                    placeholder={t('medicalRecord.routePlaceholder')}
                    placeholderTextColor={Brand.muted}
                  />
                </View>
                <View style={styles.formRowField}>
                  <Text style={styles.fieldLabel}>{t('medicalRecord.durationDays')}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.durationDays}
                    onChangeText={(v) => setField('durationDays', v)}
                    keyboardType="number-pad"
                    placeholderTextColor={Brand.muted}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formRowField}>
                  <Text style={styles.fieldLabel}>{t('medicalRecord.veterinarianId')}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.veterinarianId}
                    onChangeText={(v) => setField('veterinarianId', v)}
                    keyboardType="number-pad"
                    placeholderTextColor={Brand.muted}
                  />
                </View>
                <View style={styles.formRowField}>
                  <Text style={styles.fieldLabel}>{t('medicalRecord.clinicName')}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.clinicName}
                    onChangeText={(v) => setField('clinicName', v)}
                    placeholderTextColor={Brand.muted}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formRowField}>
                  <Text style={styles.fieldLabel}>{t('medicalRecord.temperature')}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.temperature}
                    onChangeText={(v) => setField('temperature', v)}
                    keyboardType="decimal-pad"
                    placeholderTextColor={Brand.muted}
                  />
                </View>
                <View style={styles.formRowField}>
                  <Text style={styles.fieldLabel}>{t('medicalRecord.weight')}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.weight}
                    onChangeText={(v) => setField('weight', v)}
                    keyboardType="decimal-pad"
                    placeholderTextColor={Brand.muted}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formRowField}>
                  <Text style={styles.fieldLabel}>{t('medicalRecord.heartRate')}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.heartRate}
                    onChangeText={(v) => setField('heartRate', v)}
                    keyboardType="number-pad"
                    placeholderTextColor={Brand.muted}
                  />
                </View>
                <View style={styles.formRowField}>
                  <Text style={styles.fieldLabel}>{t('medicalRecord.respiratoryRate')}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.respiratoryRate}
                    onChangeText={(v) => setField('respiratoryRate', v)}
                    keyboardType="number-pad"
                    placeholderTextColor={Brand.muted}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>{t('medicalRecord.followUpDate')}</Text>
              <DateField
                value={form.followUpDate}
                onChange={(v) => setField('followUpDate', v)}
                placeholder={t('medicalRecord.visitDatePlaceholder')}
              />

              <View style={styles.formRow}>
                <View style={styles.formRowField}>
                  <Text style={styles.fieldLabel}>{t('medicalRecord.cost')}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.cost}
                    onChangeText={(v) => setField('cost', v)}
                    keyboardType="decimal-pad"
                    placeholderTextColor={Brand.muted}
                  />
                </View>
                <View style={styles.formRowField}>
                  <Text style={styles.fieldLabel}>{t('medicalRecord.outcome')}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.outcome}
                    onChangeText={(v) => setField('outcome', v)}
                    placeholder={t('medicalRecord.outcomePlaceholder')}
                    placeholderTextColor={Brand.muted}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>{t('medicalRecord.notes')}</Text>
              <TextInput
                style={styles.input}
                value={form.notes}
                onChangeText={(v) => setField('notes', v)}
                placeholder={t('medicalRecord.notesPlaceholder')}
                placeholderTextColor={Brand.muted}
                multiline
              />
            </ScrollView>

            {error ? <Text style={styles.errorText}>{t('medicalRecord.saveError')}</Text> : null}

            <View style={styles.formActions}>
              <Pressable style={styles.formCancelButton} onPress={() => setAddVisible(false)}>
                <Text style={styles.formCancelLabel}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.formSubmitButton, !canSubmit && styles.formSubmitButtonDisabled]}
                onPress={handleAdd}
                disabled={!canSubmit}>
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.formSubmitLabel}>{t('common.add')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

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

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString();
}

const recordStyles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 4,
  },
  line: {
    fontSize: 13,
    color: Brand.dark,
    marginTop: 2,
  },
});
