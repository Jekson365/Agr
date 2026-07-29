import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { KindPicker, type KindOption } from '@/components/farm/shared/kind-picker';
import { styles } from '@/components/farm/shared/styles';
import { fruitKindImage, fruitTypeLabel, TREE_STOCK_UNIT_OPTIONS } from '@/components/farm/tree-stock/tree-stock';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { createFruitKind, getFruitKinds } from '@/services/fruit-kind-service';
import { createTreeStock, updateTreeStock } from '@/services/tree-stock-service';
import type { FruitKind } from '@/types/fruit-kind';
import type { FruitType, TreeStock, TreeStockUnit } from '@/types/tree-stock';

type Props = {
  visible: boolean;
  editingStock: TreeStock | null;
  /** The rows that already exist, so a duplicate name is caught before saving. */
  existingItems: TreeStock[];
  onClose: () => void;
  onSaved: (stock: TreeStock, isNew: boolean) => void;
};

export function TreeStockFormModal({ visible, editingStock, existingItems, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [kinds, setKinds] = useState<FruitKind[]>([]);
  const [kindsLoading, setKindsLoading] = useState(true);
  const [fruitType, setFruitType] = useState<FruitType>('');
  const [nameInput, setNameInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [unit, setUnit] = useState<TreeStockUnit>('Kilogram');

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingStock != null;

  // Initialize the fields, and load which fruit kinds exist to pick from, whenever opened.
  useEffect(() => {
    if (!visible) return;
    setFruitType(editingStock?.type ?? '');
    setNameInput(editingStock?.name ?? '');
    setAmountInput(editingStock ? String(editingStock.amount) : '');
    setUnit(editingStock?.unit ?? 'Kilogram');
    setFormError(null);
    loadKinds(editingStock?.type ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editingStock]);

  async function loadKinds(preset: string | null) {
    setKindsLoading(true);
    try {
      const list = await getFruitKinds();
      setKinds(list);
      if (!preset) {
        setFruitType(list[0]?.name ?? '');
      }
    } catch {
      setKinds([]);
    } finally {
      setKindsLoading(false);
    }
  }

  async function handleAddKind(name: string): Promise<KindOption | null> {
    try {
      const created = await createFruitKind({ name });
      setKinds((prev) => (prev.some((k) => k.name === created.name) ? prev : [...prev, created]));
      return { value: created.name, label: fruitTypeLabel(created.name, t) };
    } catch {
      return null;
    }
  }

  const amount = Math.max(0, parseFloat(amountInput) || 0);
  const canSubmit = amount >= 0 && fruitType.trim() !== '' && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;

    const trimmedName = nameInput.trim();
    // The label is what tells two stocks of the same fruit apart, so it can't be shared. A blank
    // one isn't a label — those rows show their fruit's name instead, and any number may exist.
    const nameTaken =
      trimmedName !== '' &&
      existingItems.some(
        (item) => item.id !== editingStock?.id && item.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
    if (nameTaken) {
      setFormError(t('treeStock.nameDuplicate'));
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const name = trimmedName;
      if (isEditing) {
        const updated: TreeStock = { ...editingStock, type: fruitType, name, amount, unit };
        await updateTreeStock(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createTreeStock({ type: fruitType, name, amount, unit, landPlotId: null });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      // The server rejects a name another row already uses (e.g. added from another session).
      if (err instanceof ApiError && err.status === 409) {
        setFormError(t('treeStock.nameDuplicate'));
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
          <Text style={styles.formTitle}>{isEditing ? t('treeStock.edit') : t('treeStock.add')}</Text>

          <Text style={styles.fieldLabel}>{t('farm.type')}</Text>
          <KindPicker
            options={kinds.map((k) => ({ value: k.name, label: fruitTypeLabel(k.name, t), icon: fruitKindImage(k.name) }))}
            selected={fruitType}
            onSelect={setFruitType}
            onAddNew={handleAddKind}
            addPlaceholder={t('treeStock.newFruitTypePlaceholder')}
            loading={kindsLoading}
          />

          <Text style={styles.fieldLabel}>{t('farm.name')}</Text>
          <TextInput
            style={styles.input}
            value={nameInput}
            onChangeText={setNameInput}
            placeholder={t('treeStock.namePlaceholder')}
            placeholderTextColor={Brand.muted}
          />

          <Text style={styles.fieldLabel}>{t('farm.amount')}</Text>
          <TextInput
            style={styles.input}
            value={amountInput}
            onChangeText={setAmountInput}
            placeholder={t('farm.amountPlaceholder')}
            placeholderTextColor={Brand.muted}
            keyboardType="decimal-pad"
          />

          <Text style={styles.fieldLabel}>{t('farm.unit')}</Text>
          <View style={styles.kindRow}>
            {TREE_STOCK_UNIT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.kindChip, unit === opt.value && styles.kindChipActive]}
                onPress={() => setUnit(opt.value as TreeStockUnit)}>
                <Text style={[styles.kindChipLabel, unit === opt.value && styles.kindChipLabelActive]}>
                  {t(opt.labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>

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
