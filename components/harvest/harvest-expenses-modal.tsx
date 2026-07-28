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

import { styles } from '@/components/farm/shared/styles';
import { Brand } from '@/constants/theme';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import { updateHarvest } from '@/services/harvest-service';
import type { Harvest } from '@/types/harvest';

type Props = {
  visible: boolean;
  harvest: Harvest;
  onClose: () => void;
  onSaved: (harvest: Harvest) => void;
};

function parseAmount(input: string): number {
  return Math.max(0, parseFloat(input) || 0);
}

export function HarvestExpensesModal({ visible, harvest, onClose, onSaved }: Props) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  const [equipmentInput, setEquipmentInput] = useState('');
  const [workersInput, setWorkersInput] = useState('');
  const [fuelInput, setFuelInput] = useState('');
  const [otherInput, setOtherInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setEquipmentInput(harvest.equipmentCost != null ? String(harvest.equipmentCost) : '');
    setWorkersInput(harvest.workersCost != null ? String(harvest.workersCost) : '');
    setFuelInput(harvest.fuelCost != null ? String(harvest.fuelCost) : '');
    setOtherInput(harvest.otherCost != null ? String(harvest.otherCost) : '');
    setFormError(null);
  }, [visible, harvest]);

  const total = parseAmount(equipmentInput) + parseAmount(workersInput) + parseAmount(fuelInput) + parseAmount(otherInput);

  async function handleSubmit() {
    setSaving(true);
    setFormError(null);
    try {
      const updated: Harvest = {
        ...harvest,
        equipmentCost: equipmentInput.trim() ? parseAmount(equipmentInput) : null,
        workersCost: workersInput.trim() ? parseAmount(workersInput) : null,
        fuelCost: fuelInput.trim() ? parseAmount(fuelInput) : null,
        otherCost: otherInput.trim() ? parseAmount(otherInput) : null,
      };
      await updateHarvest(updated.id, updated);
      onSaved(updated);
      onClose();
    } catch {
      setFormError(t('harvest.expensesSaveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.formOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{t('harvest.expensesTitle')}</Text>

          <View style={styles.formRow}>
            <View style={styles.formRowField}>
              <Text style={styles.fieldLabel}>{t('harvest.expenseEquipment')}</Text>
              <TextInput
                style={styles.input}
                value={equipmentInput}
                onChangeText={setEquipmentInput}
                placeholder="0"
                placeholderTextColor={Brand.muted}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.formRowField}>
              <Text style={styles.fieldLabel}>{t('harvest.expenseWorkers')}</Text>
              <TextInput
                style={styles.input}
                value={workersInput}
                onChangeText={setWorkersInput}
                placeholder="0"
                placeholderTextColor={Brand.muted}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.formRow}>
            <View style={styles.formRowField}>
              <Text style={styles.fieldLabel}>{t('harvest.expenseFuel')}</Text>
              <TextInput
                style={styles.input}
                value={fuelInput}
                onChangeText={setFuelInput}
                placeholder="0"
                placeholderTextColor={Brand.muted}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.formRowField}>
              <Text style={styles.fieldLabel}>{t('harvest.expenseOther')}</Text>
              <TextInput
                style={styles.input}
                value={otherInput}
                onChangeText={setOtherInput}
                placeholder="0"
                placeholderTextColor={Brand.muted}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={local.totalRow}>
            <Text style={local.totalLabel}>{t('harvest.expensesTotal')}</Text>
            <Text style={local.totalValue}>{formatPrice(total)}</Text>
          </View>

          {formError && <Text style={styles.errorText}>{formError}</Text>}

          <View style={styles.formActions}>
            <Pressable style={styles.formCancelButton} onPress={onClose}>
              <Text style={styles.formCancelLabel}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[styles.formSubmitButton, saving && styles.formSubmitButtonDisabled]}
              onPress={handleSubmit}
              disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.formSubmitLabel}>{t('common.save')}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const local = StyleSheet.create({
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Brand.border,
    paddingTop: 12,
    marginTop: 4,
    marginBottom: 14,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.dark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Brand.green,
  },
});
