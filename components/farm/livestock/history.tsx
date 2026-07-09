import Ionicons from '@expo/vector-icons/Ionicons';
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
import { useLanguage } from '@/contexts/language-context';
import {
  createStockHistory,
  deleteStockHistory,
  getStockHistory,
} from '@/services/stock-history-service';
import type { StockHistory } from '@/types/stock-history';

type Props = {
  /** The animal (LivestockDetail) whose weight history this is. */
  stockId: number;
};

/**
 * Weight-change history for a single animal: the readings over time, plus an
 * "add new record" button that opens a small form to log another weight.
 */
export function StockHistoryView({ stockId }: Props) {
  const { t } = useLanguage();

  const [records, setRecords] = useState<StockHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addVisible, setAddVisible] = useState(false);
  const [weightInput, setWeightInput] = useState('');
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
      setRecords(await getStockHistory(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const weight = parseFloat(weightInput);
  const canSubmit = weight > 0 && !saving;

  function openAdd() {
    setWeightInput('');
    setError(null);
    setAddVisible(true);
  }

  async function handleAdd() {
    if (!(weight > 0)) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createStockHistory({ stockId, weight });
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
      await deleteStockHistory(id);
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

  // Records come back ordered oldest→newest; derive current weight and total gain from that.
  const current = records.length ? records[records.length - 1].weight : null;
  const gain = records.length >= 2 ? records[records.length - 1].weight - records[0].weight : null;

  // Flag each reading that weighs less than the reading before it (weight loss).
  const withTrend = records.map((record, i) => ({
    record,
    decreased: i > 0 && record.weight < records[i - 1].weight,
  }));
  const newestFirst = [...withTrend].reverse();

  return (
    <>
      {current != null ? (
        <View style={styles.historySummary}>
          <View>
            <Text style={styles.historyStatLabel}>{t('history.current')}</Text>
            <Text style={styles.historyStatValue}>
              {current} {t('farm.unitKg')}
            </Text>
          </View>
          {gain != null ? (
            <View>
              <Text style={styles.historyStatLabel}>{t('history.gain')}</Text>
              <Text style={styles.historyStatValue}>
                {gain >= 0 ? '+' : ''}
                {gain} {t('farm.unitKg')}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {records.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{t('history.empty')}</Text>
        </View>
      ) : (
        newestFirst.map(({ record, decreased }) => (
          <View key={record.id} style={[styles.historyRow, decreased ? styles.historyRowDown : styles.historyRowUp]}>
            <Text style={styles.historyRowDate}>{formatDateTime(record.createdAt)}</Text>
            <View style={styles.historyRowRight}>
              <Text
                style={[
                  styles.historyRowWeight,
                  decreased ? styles.historyRowWeightDown : styles.historyRowWeightUp,
                ]}>
                {record.weight} {t('farm.unitKg')}
              </Text>
              <Pressable
                hitSlop={8}
                onPress={() => handleDelete(record.id)}
                accessibilityRole="button"
                accessibilityLabel={t('common.delete')}>
                <Ionicons name="trash-outline" size={18} color={Brand.muted} />
              </Pressable>
            </View>
          </View>
        ))
      )}

      {error ? <Text style={styles.errorText}>{t('history.loadError')}</Text> : null}

      <Pressable style={styles.addButton} onPress={openAdd}>
        <Ionicons name="add" size={18} color={Brand.dark} />
        <Text style={styles.addButtonLabel}>{t('history.addRecord')}</Text>
      </Pressable>

      <Modal visible={addVisible} transparent animationType="slide" onRequestClose={() => setAddVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.formOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAddVisible(false)} />
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{t('history.addRecord')}</Text>

            <Text style={styles.fieldLabel}>{t('history.weightPlaceholder')}</Text>
            <TextInput
              style={styles.input}
              value={weightInput}
              onChangeText={setWeightInput}
              placeholder={t('history.weightPlaceholder')}
              placeholderTextColor={Brand.muted}
              keyboardType="decimal-pad"
              autoFocus
            />

            {error ? <Text style={styles.errorText}>{t('farm.saveError')}</Text> : null}

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

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
