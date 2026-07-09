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

import { PRODUCTION_TYPE_LABEL_KEY, UNIT_LABEL_KEY } from '@/components/farm/livestock/production';
import { styles } from '@/components/farm/shared/styles';
import { DateField } from '@/components/ui/date-field';
import { toIsoDate } from '@/components/ui/date-utils';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import {
  createAnimalProduction,
  deleteAnimalProduction,
  getAnimalProductions,
  getLivestockProductions,
} from '@/services/animal-production-service';
import { getProductionTypes } from '@/services/production-type-service';
import { getUnits } from '@/services/unit-service';
import type { AnimalProduction } from '@/types/animal-production';
import type { ProductionType } from '@/types/production-type';
import type { Unit } from '@/types/unit';

type Props =
  | {
      /** The animal (LivestockDetail) whose production records these are. */
      target: 'animal';
      animalId: number;
    }
  | {
      /** The livestock group whose combined production records these are. */
      target: 'livestock';
      livestockId: number;
      /** The group's current head count, used to prefill the "animals counted" field. */
      animalCount: number;
    };

function makeEmptyForm(animalCount: number) {
  return {
    productionTypeId: null as number | null,
    collectionDate: toIsoDate(new Date()) as string | null,
    quantity: '',
    unitId: null as number | null,
    animalCount: String(animalCount),
    quality: '',
    pricePerUnit: '',
    totalPrice: '',
    totalPriceEdited: false,
    collectedBy: '',
    batchNumber: '',
    notes: '',
  };
}

/**
 * Production history for either a single animal or a whole livestock group: milking/
 * egg-collection/etc. batches with quantity, unit, and optional pricing/collector details, plus
 * an "add new record" button.
 */
export function AnimalProductionView(props: Props) {
  const { t } = useLanguage();
  const isGroup = props.target === 'livestock';
  const ownerId = isGroup ? props.livestockId : props.animalId;
  const defaultAnimalCount = isGroup ? props.animalCount : 1;

  const [records, setRecords] = useState<AnimalProduction[]>([]);
  const [productionTypes, setProductionTypes] = useState<ProductionType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addVisible, setAddVisible] = useState(false);
  const [form, setForm] = useState(() => makeEmptyForm(defaultAnimalCount));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ownerId) return;
    load(ownerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId]);

  async function load(id: number) {
    setLoading(true);
    setError(null);
    try {
      const [recordList, typeList, unitList] = await Promise.all([
        isGroup ? getLivestockProductions(id) : getAnimalProductions(id),
        getProductionTypes(),
        getUnits(),
      ]);
      setRecords(recordList);
      setProductionTypes(typeList);
      setUnits(unitList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function setField<K extends keyof ReturnType<typeof makeEmptyForm>>(
    key: K,
    value: ReturnType<typeof makeEmptyForm>[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setQuantityOrPrice(key: 'quantity' | 'pricePerUnit', value: string) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (!prev.totalPriceEdited) {
        const quantity = parseFloat(next.quantity);
        const pricePerUnit = parseFloat(next.pricePerUnit);
        next.totalPrice = quantity > 0 && pricePerUnit > 0 ? String(quantity * pricePerUnit) : prev.totalPrice;
      }
      return next;
    });
  }

  const canSubmit =
    form.productionTypeId != null &&
    form.unitId != null &&
    !!form.collectionDate &&
    parseFloat(form.quantity) > 0 &&
    (!isGroup || parseInt(form.animalCount, 10) > 0) &&
    !saving;

  function openAdd() {
    setForm({
      ...makeEmptyForm(defaultAnimalCount),
      productionTypeId: productionTypes[0]?.id ?? null,
      unitId: units[0]?.id ?? null,
    });
    setError(null);
    setAddVisible(true);
  }

  async function handleAdd() {
    if (!canSubmit || form.productionTypeId == null || form.unitId == null || !form.collectionDate) return;

    setSaving(true);
    setError(null);
    try {
      const created = await createAnimalProduction({
        animalId: isGroup ? null : props.animalId,
        livestockId: isGroup ? props.livestockId : null,
        animalCount: isGroup ? parseInt(form.animalCount, 10) : 1,
        productionTypeId: form.productionTypeId,
        collectionDate: form.collectionDate,
        quantity: parseFloat(form.quantity),
        unitId: form.unitId,
        quality: form.quality.trim() || null,
        pricePerUnit: parseFloatOrNull(form.pricePerUnit),
        totalPrice: parseFloatOrNull(form.totalPrice),
        collectedBy: form.collectedBy.trim() || null,
        batchNumber: form.batchNumber.trim() || null,
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
      await deleteAnimalProduction(id);
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

  const typeById = new Map(productionTypes.map((pt) => [pt.id, pt]));
  const unitById = new Map(units.map((u) => [u.id, u]));

  function typeLabel(productionType?: ProductionType) {
    if (!productionType) return '';
    return t(PRODUCTION_TYPE_LABEL_KEY[productionType.name] ?? productionType.name);
  }

  function unitLabel(unit?: Unit) {
    if (!unit) return '';
    return t(UNIT_LABEL_KEY[unit.name] ?? unit.name);
  }

  // Records come back ordered oldest→newest; show the most recent batch first.
  const newestFirst = [...records].reverse();

  return (
    <>
      {records.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{t('production.empty')}</Text>
        </View>
      ) : (
        newestFirst.map((record) => {
          const unit = unitById.get(record.unitId);
          return (
            <View key={record.id} style={[styles.historyRow, styles.historyRowUp, recordStyles.row]}>
              <View style={styles.cardInfo}>
                <View style={recordStyles.header}>
                  <Text style={styles.historyRowDate}>{formatDate(record.collectionDate)}</Text>
                  <Text style={styles.historyRowWeight}>{typeLabel(typeById.get(record.productionTypeId))}</Text>
                </View>

                <Text style={recordStyles.line}>
                  {record.quantity} {unit?.shortName ?? ''}
                  {unit ? ` (${unitLabel(unit)})` : ''}
                </Text>
                {isGroup ? (
                  <Text style={recordStyles.line}>
                    {t('production.animalCount')}: {record.animalCount}
                  </Text>
                ) : null}
                {record.quality ? (
                  <Text style={recordStyles.line}>
                    {t('production.quality')}: {record.quality}
                  </Text>
                ) : null}
                {record.pricePerUnit != null || record.totalPrice != null ? (
                  <Text style={recordStyles.line}>
                    {record.pricePerUnit != null ? `${t('production.pricePerUnit')}: ${record.pricePerUnit}` : ''}
                    {record.pricePerUnit != null && record.totalPrice != null ? ' · ' : ''}
                    {record.totalPrice != null ? `${t('production.totalPrice')}: ${record.totalPrice}` : ''}
                  </Text>
                ) : null}
                {record.collectedBy || record.batchNumber ? (
                  <Text style={recordStyles.line}>
                    {record.collectedBy ?? ''}
                    {record.collectedBy && record.batchNumber ? ' · ' : ''}
                    {record.batchNumber ? `${t('production.batchNumber')}: ${record.batchNumber}` : ''}
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
          );
        })
      )}

      {error ? <Text style={styles.errorText}>{t('production.loadError')}</Text> : null}

      <Pressable style={styles.addButton} onPress={openAdd}>
        <Ionicons name="add" size={18} color={Brand.dark} />
        <Text style={styles.addButtonLabel}>{t('production.addRecord')}</Text>
      </Pressable>

      <Modal visible={addVisible} transparent animationType="slide" onRequestClose={() => setAddVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.formOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAddVisible(false)} />
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{t('production.addRecord')}</Text>

            <ScrollView style={styles.formScrollArea} showsVerticalScrollIndicator>
              <Text style={styles.fieldLabel}>{t('production.type')}</Text>
              <View style={styles.kindRow}>
                {productionTypes.map((pt) => (
                  <Pressable
                    key={pt.id}
                    style={[styles.kindChip, form.productionTypeId === pt.id && styles.kindChipActive]}
                    onPress={() => setField('productionTypeId', pt.id)}>
                    <Text
                      style={[
                        styles.kindChipLabel,
                        form.productionTypeId === pt.id && styles.kindChipLabelActive,
                      ]}>
                      {typeLabel(pt)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>{t('production.collectionDate')}</Text>
              <DateField
                value={form.collectionDate}
                onChange={(v) => setField('collectionDate', v)}
                placeholder={t('production.collectionDatePlaceholder')}
                maximumDate={new Date()}
              />

              <Text style={styles.fieldLabel}>{t('production.quantity')}</Text>
              <TextInput
                style={styles.input}
                value={form.quantity}
                onChangeText={(v) => setQuantityOrPrice('quantity', v)}
                placeholder={t('production.quantityPlaceholder')}
                placeholderTextColor={Brand.muted}
                keyboardType="decimal-pad"
              />

              <Text style={styles.fieldLabel}>{t('production.unit')}</Text>
              <View style={styles.kindRow}>
                {units.map((u) => (
                  <Pressable
                    key={u.id}
                    style={[styles.kindChip, form.unitId === u.id && styles.kindChipActive]}
                    onPress={() => setField('unitId', u.id)}>
                    <Text style={[styles.kindChipLabel, form.unitId === u.id && styles.kindChipLabelActive]}>
                      {unitLabel(u)} ({u.shortName})
                    </Text>
                  </Pressable>
                ))}
              </View>

              {isGroup ? (
                <>
                  <Text style={styles.fieldLabel}>{t('production.animalCount')}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.animalCount}
                    onChangeText={(v) => setField('animalCount', v)}
                    placeholder={t('production.animalCountPlaceholder')}
                    placeholderTextColor={Brand.muted}
                    keyboardType="number-pad"
                  />
                </>
              ) : null}

              <Text style={styles.fieldLabel}>{t('production.quality')}</Text>
              <TextInput
                style={styles.input}
                value={form.quality}
                onChangeText={(v) => setField('quality', v)}
                placeholder={t('production.qualityPlaceholder')}
                placeholderTextColor={Brand.muted}
              />

              <View style={styles.formRow}>
                <View style={styles.formRowField}>
                  <Text style={styles.fieldLabel}>{t('production.pricePerUnit')}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.pricePerUnit}
                    onChangeText={(v) => setQuantityOrPrice('pricePerUnit', v)}
                    keyboardType="decimal-pad"
                    placeholderTextColor={Brand.muted}
                  />
                </View>
                <View style={styles.formRowField}>
                  <Text style={styles.fieldLabel}>{t('production.totalPrice')}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.totalPrice}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, totalPrice: v, totalPriceEdited: true }))}
                    keyboardType="decimal-pad"
                    placeholderTextColor={Brand.muted}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formRowField}>
                  <Text style={styles.fieldLabel}>{t('production.collectedBy')}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.collectedBy}
                    onChangeText={(v) => setField('collectedBy', v)}
                    placeholderTextColor={Brand.muted}
                  />
                </View>
                <View style={styles.formRowField}>
                  <Text style={styles.fieldLabel}>{t('production.batchNumber')}</Text>
                  <TextInput
                    style={styles.input}
                    value={form.batchNumber}
                    onChangeText={(v) => setField('batchNumber', v)}
                    placeholderTextColor={Brand.muted}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>{t('production.notes')}</Text>
              <TextInput
                style={styles.input}
                value={form.notes}
                onChangeText={(v) => setField('notes', v)}
                placeholder={t('production.notesPlaceholder')}
                placeholderTextColor={Brand.muted}
                multiline
              />
            </ScrollView>

            {error ? <Text style={styles.errorText}>{t('production.saveError')}</Text> : null}

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
