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
import { stockKindImage, stockTypeLabel, STOCK_UNIT_LABEL_KEY } from '@/components/farm/stock/stock';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { createStockFeed, deleteStockFeed, getStockFeeds, updateStockFeed } from '@/services/stock-feed-service';
import { getStock } from '@/services/stock-service';
import type { Stock } from '@/types/stock';
import type { StockFeed } from '@/types/stock-feed';

type Props = {
  /** The livestock group this animal belongs to — feed is tracked per group. */
  livestockId: number;
};

/** Icons for what a livestock group is fed; tapping one lets you edit its amount. */
export function StockFeedRow({ livestockId }: Props) {
  const { t } = useLanguage();

  const [feeds, setFeeds] = useState<StockFeed[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingFeed, setEditingFeed] = useState<StockFeed | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [saving, setSaving] = useState(false);

  const [addVisible, setAddVisible] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livestockId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [feedList, stockList] = await Promise.all([getStockFeeds(livestockId), getStock()]);
      setFeeds(feedList);
      setStocks(stockList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function stockFor(feed: StockFeed): Stock | undefined {
    return stocks.find((s) => s.id === feed.stockId);
  }

  function openEdit(feed: StockFeed) {
    setEditingFeed(feed);
    setAmountInput(String(feed.amount));
  }

  function openAdd() {
    setSelectedStockId(stocks[0]?.id ?? null);
    setAmountInput('');
    setAddVisible(true);
  }

  const editAmount = parseFloat(amountInput);

  async function handleSaveEdit() {
    if (!editingFeed || !(editAmount > 0)) return;
    setSaving(true);
    setError(null);
    try {
      const updated: StockFeed = { ...editingFeed, amount: editAmount };
      await updateStockFeed(updated.id, updated);
      setFeeds((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setEditingFeed(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editingFeed) return;
    setSaving(true);
    setError(null);
    try {
      await deleteStockFeed(editingFeed.id);
      setFeeds((prev) => prev.filter((f) => f.id !== editingFeed.id));
      setEditingFeed(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd() {
    if (selectedStockId == null || !(editAmount > 0)) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createStockFeed({ livestockId, stockId: selectedStockId, amount: editAmount });
      setFeeds((prev) => [...prev, created]);
      setAddVisible(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.stateBox}>
        <ActivityIndicator color={Brand.dark} />
      </View>
    );
  }

  return (
    <>
      <View style={styles.feedRow}>
        {feeds.map((feed) => {
          const stock = stockFor(feed);
          return (
            <Pressable
              key={feed.id}
              style={styles.feedItem}
              onPress={() => openEdit(feed)}
              accessibilityRole="button"
              accessibilityLabel={stock ? stockTypeLabel(stock.type, t) : t('feed.editTitle')}>
              <View style={styles.feedIconWrap}>
                {stock ? (
                  <Image source={stockKindImage(stock.type)} style={styles.stockIcon} resizeMode="contain" />
                ) : (
                  <Ionicons name="help-outline" size={26} color={Brand.dark} />
                )}
              </View>
              <Text style={styles.feedAmountLabel} numberOfLines={1}>
                {feed.amount} {stock ? t(STOCK_UNIT_LABEL_KEY[stock.unit]) : ''}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          style={styles.feedItem}
          onPress={openAdd}
          accessibilityRole="button"
          accessibilityLabel={t('feed.addTitle')}>
          <View style={styles.feedAddIconWrap}>
            <Ionicons name="add" size={26} color={Brand.muted} />
          </View>
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Edit an existing feed's amount */}
      <Modal
        visible={!!editingFeed}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingFeed(null)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.formOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditingFeed(null)} />
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {t('feed.editTitle')}
              {editingFeed && stockFor(editingFeed)
                ? ` — ${stockTypeLabel(stockFor(editingFeed)!.type, t)}`
                : ''}
            </Text>

            <Text style={styles.fieldLabel}>{t('farm.amount')}</Text>
            <TextInput
              style={styles.input}
              value={amountInput}
              onChangeText={setAmountInput}
              placeholder={t('farm.amountPlaceholder')}
              placeholderTextColor={Brand.muted}
              keyboardType="decimal-pad"
              autoFocus
            />

            <View style={styles.formActions}>
              <Pressable style={styles.formCancelButton} onPress={handleDelete} disabled={saving}>
                <Text style={[styles.formCancelLabel, styles.sheetItemDanger]}>{t('common.delete')}</Text>
              </Pressable>
              <Pressable
                style={[styles.formSubmitButton, !(editAmount > 0) && styles.formSubmitButtonDisabled]}
                onPress={handleSaveEdit}
                disabled={saving || !(editAmount > 0)}>
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

      {/* Add a new feed entry */}
      <Modal visible={addVisible} transparent animationType="slide" onRequestClose={() => setAddVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.formOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAddVisible(false)} />
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{t('feed.addTitle')}</Text>

            {stocks.length === 0 ? (
              <Text style={styles.emptyHint}>{t('feed.noStock')}</Text>
            ) : (
              <>
                <Text style={styles.fieldLabel}>{t('feed.selectStock')}</Text>
                <View style={styles.feedPickerRow}>
                  {stocks.map((stock) => (
                    <Pressable
                      key={stock.id}
                      style={[styles.kindChip, selectedStockId === stock.id && styles.kindChipActive]}
                      onPress={() => setSelectedStockId(stock.id)}>
                      <Image source={stockKindImage(stock.type)} style={styles.kindChipIcon} resizeMode="contain" />
                      <Text
                        style={[
                          styles.kindChipLabel,
                          selectedStockId === stock.id && styles.kindChipLabelActive,
                        ]}>
                        {stockTypeLabel(stock.type, t)}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.fieldLabel}>{t('farm.amount')}</Text>
                <TextInput
                  style={styles.input}
                  value={amountInput}
                  onChangeText={setAmountInput}
                  placeholder={t('farm.amountPlaceholder')}
                  placeholderTextColor={Brand.muted}
                  keyboardType="decimal-pad"
                />
              </>
            )}

            <View style={styles.formActions}>
              <Pressable style={styles.formCancelButton} onPress={() => setAddVisible(false)}>
                <Text style={styles.formCancelLabel}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.formSubmitButton,
                  (!(editAmount > 0) || selectedStockId == null) && styles.formSubmitButtonDisabled,
                ]}
                onPress={handleAdd}
                disabled={saving || !(editAmount > 0) || selectedStockId == null}>
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
