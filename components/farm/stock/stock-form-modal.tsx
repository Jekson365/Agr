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
import { STOCK_UNIT_OPTIONS, stockTypeLabel } from '@/components/farm/stock/stock';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { createStockKind, getStockKinds } from '@/services/stock-kind-service';
import { createStock, updateStock } from '@/services/stock-service';
import type { Stock, StockType, StockUnit } from '@/types/stock';
import type { StockKind } from '@/types/stock-kind';

type Props = {
  visible: boolean;
  editingStock: Stock | null;
  onClose: () => void;
  onSaved: (stock: Stock, isNew: boolean) => void;
};

export function StockFormModal({ visible, editingStock, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [kinds, setKinds] = useState<StockKind[]>([]);
  const [kindsLoading, setKindsLoading] = useState(true);
  const [stockType, setStockType] = useState<StockType>('');
  const [nameInput, setNameInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [unit, setUnit] = useState<StockUnit>('Kilogram');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingStock != null;

  // Initialize the fields whenever the modal is opened.
  useEffect(() => {
    if (!visible) return;
    setStockType(editingStock?.type ?? '');
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
      const list = await getStockKinds();
      setKinds(list);
      if (!preset) {
        setStockType(list[0]?.name ?? '');
      }
    } catch {
      setKinds([]);
    } finally {
      setKindsLoading(false);
    }
  }

  async function handleAddKind(name: string): Promise<KindOption | null> {
    try {
      const created = await createStockKind({ name });
      setKinds((prev) => (prev.some((k) => k.name === created.name) ? prev : [...prev, created]));
      return { value: created.name, label: stockTypeLabel(created.name, t) };
    } catch {
      return null;
    }
  }

  const amount = Math.max(0, parseFloat(amountInput) || 0);
  const canSubmit = amount >= 0 && stockType.trim() !== '' && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;

    setSaving(true);
    setFormError(null);
    try {
      const name = nameInput.trim();
      if (isEditing) {
        const updated: Stock = { ...editingStock, type: stockType, name, amount, unit };
        await updateStock(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createStock({ type: stockType, name, amount, unit });
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
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
          <Text style={styles.formTitle}>{isEditing ? t('farm.editStock') : t('farm.addStock')}</Text>

          <Text style={styles.fieldLabel}>{t('farm.type')}</Text>
          <KindPicker
            options={kinds.map((k) => ({ value: k.name, label: stockTypeLabel(k.name, t) }))}
            selected={stockType}
            onSelect={setStockType}
            onAddNew={handleAddKind}
            addPlaceholder={t('farm.newStockTypePlaceholder')}
            loading={kindsLoading}
          />

          <Text style={styles.fieldLabel}>{t('farm.name')}</Text>
          <TextInput
            style={styles.input}
            value={nameInput}
            onChangeText={setNameInput}
            placeholder={t('farm.stockNamePlaceholder')}
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
            {STOCK_UNIT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.kindChip, unit === opt.value && styles.kindChipActive]}
                onPress={() => setUnit(opt.value as StockUnit)}>
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
              disabled={!canSubmit}
              >
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
