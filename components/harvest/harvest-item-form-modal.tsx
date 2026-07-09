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
import { buildHarvestTargetOptions, harvestTargetKey } from '@/components/harvest/harvest-target';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { createHarvestItem, updateHarvestItem } from '@/services/harvest-item-service';
import { getStock } from '@/services/stock-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { HarvestItem } from '@/types/harvest-item';
import type { Stock } from '@/types/stock';
import type { TreeStock } from '@/types/tree-stock';

type Props = {
  visible: boolean;
  harvestId: number;
  editingItem: HarvestItem | null;
  onClose: () => void;
  onSaved: (item: HarvestItem, isNew: boolean) => void;
};

export function HarvestItemFormModal({ visible, harvestId, editingItem, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [treeStocks, setTreeStocks] = useState<TreeStock[]>([]);
  const [targetsLoading, setTargetsLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingItem != null;

  // Initialize the fields, and load which stocks/tree stocks exist to pick from, whenever opened.
  useEffect(() => {
    if (!visible) return;
    setAmountInput(editingItem ? String(editingItem.amount) : '');
    setFormError(null);
    loadTargets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editingItem]);

  async function loadTargets() {
    setTargetsLoading(true);
    try {
      const [stockList, treeStockList] = await Promise.all([getStock(), getTreeStock()]);
      setStocks(stockList);
      setTreeStocks(treeStockList);

      const options = buildHarvestTargetOptions(stockList, treeStockList, t);
      const editingKey = editingItem ? harvestTargetKey(editingItem.stockId, editingItem.treeStockId) : null;
      const preset = editingKey && options.some((o) => o.key === editingKey) ? editingKey : (options[0]?.key ?? null);
      setSelectedKey(preset);
    } catch {
      setStocks([]);
      setTreeStocks([]);
      setSelectedKey(null);
    } finally {
      setTargetsLoading(false);
    }
  }

  const options = buildHarvestTargetOptions(stocks, treeStocks, t);
  const selectedOption = options.find((o) => o.key === selectedKey) ?? null;
  const amount = Math.max(0, parseFloat(amountInput) || 0);
  const canSubmit = amount >= 0 && selectedOption != null && !saving;

  async function handleSubmit() {
    if (!canSubmit || selectedOption == null) return;

    setSaving(true);
    setFormError(null);
    try {
      const target = { stockId: selectedOption.stockId, treeStockId: selectedOption.treeStockId };
      if (isEditing) {
        const updated: HarvestItem = { ...editingItem, ...target, amount };
        await updateHarvestItem(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createHarvestItem({ harvestId, ...target, amount });
        onSaved(created, true);
      }
      onClose();
    } catch {
      setFormError(t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.formOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{isEditing ? t('harvestItem.edit') : t('harvestItem.add')}</Text>

          <Text style={styles.fieldLabel}>{t('farm.stock')}</Text>
          {targetsLoading ? (
            <ActivityIndicator color={Brand.dark} style={{ marginBottom: 14 }} />
          ) : options.length === 0 ? (
            <Text style={styles.emptyHint}>{t('harvestItem.noStock')}</Text>
          ) : (
            <View style={styles.kindRow}>
              {options.map((option) => (
                <Pressable
                  key={option.key}
                  style={[styles.kindChip, selectedKey === option.key && styles.kindChipActive]}
                  onPress={() => setSelectedKey(option.key)}>
                  <Image source={option.icon} style={styles.kindChipIcon} resizeMode="contain" />
                  <Text style={[styles.kindChipLabel, selectedKey === option.key && styles.kindChipLabelActive]}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <Text style={styles.fieldLabel}>{t('farm.amount')}</Text>
          <TextInput
            style={styles.input}
            value={amountInput}
            onChangeText={setAmountInput}
            placeholder={t('farm.amountPlaceholder')}
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
