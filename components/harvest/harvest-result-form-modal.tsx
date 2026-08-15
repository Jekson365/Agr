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
import { createHarvestResult, updateHarvestResult } from '@/services/harvest-result-service';
import { getStock } from '@/services/stock-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { HarvestItem } from '@/types/harvest-item';
import type { HarvestResult } from '@/types/harvest-result';
import type { Stock } from '@/types/stock';
import type { TreeStock } from '@/types/tree-stock';

type Props = {
  visible: boolean;
  harvestId: number;
  editingResult: HarvestResult | null;
  /** The harvest's planned items — a result can only be recorded against a target that was planned. */
  plannedItems: HarvestItem[];
  onClose: () => void;
  onSaved: (result: HarvestResult, isNew: boolean) => void;
};

export function HarvestResultFormModal({
  visible,
  harvestId,
  editingResult,
  plannedItems,
  onClose,
  onSaved,
}: Props) {
  const { t } = useLanguage();

  const [stocks, setStocks] = useState<Stock[]>([]);
  const [treeStocks, setTreeStocks] = useState<TreeStock[]>([]);
  const [targetsLoading, setTargetsLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingResult != null;

  // Initialize the fields, and load which stocks/tree stocks exist to pick from, whenever opened.
  useEffect(() => {
    if (!visible) return;
    setAmountInput(editingResult ? String(editingResult.amount) : '');
    setFormError(null);
    loadTargets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editingResult]);

  async function loadTargets() {
    setTargetsLoading(true);
    try {
      // Removed goods included: the filter below keeps only what this harvest planned or the row
      // being edited, and a plan whose good has since been removed still has yield to record.
      const [stockList, treeStockList] = await Promise.all([getStock(true), getTreeStock()]);

      const plannedKeys = new Set(plannedItems.map((item) => harvestTargetKey(item.stockId, item.treeStockId)));
      const editingKey = editingResult ? harvestTargetKey(editingResult.stockId, editingResult.treeStockId) : null;

      const allowedStocks = stockList.filter(
        (s) => plannedKeys.has(`stock:${s.id}`) || editingKey === `stock:${s.id}`
      );
      const allowedTreeStocks = treeStockList.filter(
        (s) => plannedKeys.has(`tree:${s.id}`) || editingKey === `tree:${s.id}`
      );
      setStocks(allowedStocks);
      setTreeStocks(allowedTreeStocks);

      const options = buildHarvestTargetOptions(allowedStocks, allowedTreeStocks, t);
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
        const updated: HarvestResult = { ...editingResult, ...target, amount };
        await updateHarvestResult(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createHarvestResult({ harvestId, ...target, amount });
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
          <Text style={styles.formTitle}>{isEditing ? t('harvestResult.edit') : t('harvestResult.add')}</Text>

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
