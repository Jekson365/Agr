import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { styles } from '@/components/farm/shared/styles';
import { fruitKindImage, treeStockLabel } from '@/components/farm/tree-stock/tree-stock';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createLandPlot, getUsedTreeStockIds, updateLandPlot } from '@/services/land-plot-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { LandPlot } from '@/types/land-plot';
import type { TreeStock } from '@/types/tree-stock';

type Props = {
  visible: boolean;
  farmId: number;
  editingPlot: LandPlot | null;
  onClose: () => void;
  onSaved: (plot: LandPlot, isNew: boolean) => void;
};

export function LandPlotFormModal({ visible, farmId, editingPlot, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  /** The fruit entries on offer — the Fruits tab's own rows, minus the planted ones. */
  const [options, setOptions] = useState<TreeStock[]>([]);
  /** Whether the Fruits tab held anything before the planted ones were filtered out — the two
   *  empty states ("none exist yet" and "all of them are planted") need different advice. */
  const [hadAnyFruit, setHadAnyFruit] = useState(false);
  const [fruitsLoading, setFruitsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [areaInput, setAreaInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingPlot != null;
  const selected = options.find((option) => option.id === selectedId) ?? null;

  // Initialize the fields, and load which fruits are free to plant, whenever opened.
  useEffect(() => {
    if (!visible) return;
    setAreaInput(editingPlot ? String(editingPlot.area) : '');
    setFormError(null);
    setPickerOpen(false);
    loadFruits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editingPlot]);

  async function loadFruits() {
    setFruitsLoading(true);
    try {
      const [fruits, used] = await Promise.all([getTreeStock(), getUsedTreeStockIds(farmId)]);
      setHadAnyFruit(fruits.length > 0);

      // A fruit gets one plot per piece of land, so anything this land already grows is off the
      // table — other land may still grow it. The plot being edited doesn't count against itself.
      const taken = new Set(used.filter((id) => id !== editingPlot?.treeStockId));
      const free = fruits.filter((fruit) => !taken.has(fruit.id));

      setOptions(free);
      setSelectedId(pickInitial(free, editingPlot));
    } catch {
      setOptions([]);
      setSelectedId(null);
    } finally {
      setFruitsLoading(false);
    }
  }

  const area = Math.max(0, parseFloat(areaInput) || 0);
  const canSubmit = area > 0 && selected != null && !saving;

  async function handleSubmit() {
    if (!canSubmit || selected == null) return;

    setSaving(true);
    setFormError(null);
    try {
      // The crop is the fruit's own type; the server re-reads it from the entry either way.
      if (isEditing) {
        const updated: LandPlot = { ...editingPlot, area, crop: selected.type, treeStockId: selected.id };
        await updateLandPlot(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createLandPlot({ farmId, area, crop: selected.type, treeStockId: selected.id });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      // The server refuses a fruit that was planted meanwhile (e.g. from another session).
      if (err instanceof ApiError && err.status === 409) {
        setFormError(t('landPlot.fruitTaken'));
        return;
      }
      setFormError(err instanceof Error ? err.message : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.formOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{isEditing ? t('landPlot.edit') : t('landPlot.add')}</Text>

          <Text style={styles.fieldLabel}>{t('farm.crop')}</Text>
          {fruitsLoading ? (
            <ActivityIndicator color={Brand.dark} style={{ marginBottom: 14 }} />
          ) : options.length === 0 ? (
            <Text style={styles.emptyHint}>{t(hadAnyFruit ? 'landPlot.allCropsUsed' : 'landPlot.noCrops')}</Text>
          ) : (
            <>
              <Pressable
                style={styles.selectField}
                onPress={() => setPickerOpen((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={t('farm.crop')}>
                {selected ? (
                  <>
                    <Image source={fruitKindImage(selected.type)} style={styles.selectFieldIcon} resizeMode="contain" />
                    <Text style={styles.selectFieldText}>{treeStockLabel(selected, t)}</Text>
                  </>
                ) : (
                  <Text style={[styles.selectFieldText, styles.selectFieldPlaceholder]}>
                    {t('farm.cropPlaceholder')}
                  </Text>
                )}
                <Ionicons name={pickerOpen ? 'chevron-up' : 'chevron-down'} size={18} color={Brand.muted} />
              </Pressable>

              {pickerOpen && (
                <View style={styles.selectOptionsList}>
                  {options.map((fruit) => (
                    <Pressable
                      key={fruit.id}
                      style={[styles.selectOption, selectedId === fruit.id && styles.selectOptionActive]}
                      onPress={() => {
                        setSelectedId(fruit.id);
                        setPickerOpen(false);
                      }}>
                      <Image source={fruitKindImage(fruit.type)} style={styles.selectFieldIcon} resizeMode="contain" />
                      <Text style={styles.selectOptionLabel}>{treeStockLabel(fruit, t)}</Text>
                      {selectedId === fruit.id && <Ionicons name="checkmark" size={18} color={Brand.green} />}
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}

          <Text style={styles.fieldLabel}>{t('farm.area')}</Text>
          <TextInput
            style={styles.input}
            value={areaInput}
            onChangeText={setAreaInput}
            placeholder={t('farm.areaPlaceholder')}
            placeholderTextColor={Brand.muted}
            keyboardType="decimal-pad"
          />

          {formError && <Text style={styles.errorText}>{formError}</Text>}

          <View style={styles.formActions}>
            <Pressable style={styles.formCancelButton} onPress={onClose}>
              <Text style={styles.formCancelLabel}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[styles.formSubmitButton, !canSubmit && styles.formSubmitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.formSubmitLabel}>{isEditing ? t('common.save') : t('common.add')}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * Which fruit the form opens on: the plot's own, or — for a plot from before plots named a fruit
 * — one of the same kind as the crop it recorded, so editing it doesn't quietly replant it.
 */
function pickInitial(options: TreeStock[], editingPlot: LandPlot | null): number | null {
  if (!editingPlot) return options[0]?.id ?? null;

  const own = options.find((option) => option.id === editingPlot.treeStockId);
  if (own) return own.id;

  const crop = editingPlot.crop.trim().toLowerCase();
  const sameKind = options.find((option) => option.type.trim().toLowerCase() === crop);
  return sameKind?.id ?? null;
}
