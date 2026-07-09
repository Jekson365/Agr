import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDeleteModal } from '@/components/farm/shared/confirm-delete-modal';
import { cropLabel } from '@/components/farm/land/crop';
import { stockKindImage, stockTypeLabel, STOCK_UNIT_LABEL_KEY } from '@/components/farm/stock/stock';
import { styles } from '@/components/farm/shared/styles';
import { fruitKindImage, fruitTypeLabel, TREE_STOCK_UNIT_LABEL_KEY } from '@/components/farm/tree-stock/tree-stock';
import { HarvestItemFormModal } from '@/components/harvest/harvest-item-form-modal';
import { HarvestResultFormModal } from '@/components/harvest/harvest-result-form-modal';
import { HARVEST_STATUS_LABEL_KEY, HARVEST_STATUSES } from '@/components/harvest/status';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { parseIsoDate } from '@/components/ui/date-utils';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { getFarm } from '@/services/farm-service';
import { getHarvest, updateHarvest } from '@/services/harvest-service';
import { deleteHarvestItem, getHarvestItems } from '@/services/harvest-item-service';
import { deleteHarvestResult, getHarvestResults } from '@/services/harvest-result-service';
import { getLandPlot } from '@/services/land-plot-service';
import { getStock } from '@/services/stock-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { Farm } from '@/types/farm';
import type { Harvest, HarvestStatus } from '@/types/harvest';
import type { HarvestItem } from '@/types/harvest-item';
import type { HarvestResult } from '@/types/harvest-result';
import type { LandPlot } from '@/types/land-plot';
import type { Stock } from '@/types/stock';
import type { TreeStock } from '@/types/tree-stock';

export default function HarvestDetailScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ id: string }>();
  const harvestId = Number(params.id);

  const [harvest, setHarvest] = useState<Harvest | null>(null);
  const [items, setItems] = useState<HarvestItem[]>([]);
  const [results, setResults] = useState<HarvestResult[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [treeStocks, setTreeStocks] = useState<TreeStock[]>([]);
  const [plot, setPlot] = useState<LandPlot | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [formVisible, setFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<HarvestItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; label: string } | null>(null);

  const [resultFormVisible, setResultFormVisible] = useState(false);
  const [editingResult, setEditingResult] = useState<HarvestResult | null>(null);
  const [confirmDeleteResult, setConfirmDeleteResult] = useState<{ id: number; label: string } | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [harvestId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [item, list, resultList, stockList, treeStockList] = await Promise.all([
        getHarvest(harvestId),
        getHarvestItems(harvestId),
        getHarvestResults(harvestId),
        getStock(),
        getTreeStock(),
      ]);
      setHarvest(item);
      setItems(list);
      setResults(resultList);
      setStocks(stockList);
      setTreeStocks(treeStockList);

      if (item.landPlotId != null) {
        const plotItem = await getLandPlot(item.landPlotId);
        setPlot(plotItem);
        setFarm(await getFarm(plotItem.farmId));
      } else {
        setPlot(null);
        setFarm(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(status: HarvestStatus) {
    if (!harvest || status === harvest.status || statusSaving) return;

    const updated: Harvest = { ...harvest, status };
    setStatusSaving(true);
    setStatusError(null);
    try {
      await updateHarvest(harvest.id, updated);
      setHarvest(updated);
    } catch {
      setStatusError(t('farm.saveError'));
    } finally {
      setStatusSaving(false);
    }
  }

  type TargetInfo = { label: string; icon: number; unitLabel: string };

  function targetFor(stockId: number | null, treeStockId: number | null): TargetInfo | null {
    if (stockId != null) {
      const stock = stocks.find((s) => s.id === stockId);
      if (!stock) return null;
      return {
        label: stock.name.trim() || stockTypeLabel(stock.type, t),
        icon: stockKindImage(stock.type),
        unitLabel: t(STOCK_UNIT_LABEL_KEY[stock.unit]),
      };
    }
    if (treeStockId != null) {
      const treeStock = treeStocks.find((s) => s.id === treeStockId);
      if (!treeStock) return null;
      return {
        label: treeStock.name.trim() || fruitTypeLabel(treeStock.type, t),
        icon: fruitKindImage(treeStock.type),
        unitLabel: t(TREE_STOCK_UNIT_LABEL_KEY[treeStock.unit]),
      };
    }
    return null;
  }

  function openAdd() {
    setEditingItem(null);
    setFormVisible(true);
  }

  function openEdit(item: HarvestItem) {
    setEditingItem(item);
    setFormVisible(true);
  }

  function handleSaved(item: HarvestItem, isNew: boolean) {
    setItems((prev) => (isNew ? [...prev, item] : prev.map((i) => (i.id === item.id ? item : i))));
  }

  async function confirmDeleteItem() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteHarvestItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  function openAddResult() {
    setEditingResult(null);
    setResultFormVisible(true);
  }

  function openEditResult(result: HarvestResult) {
    setEditingResult(result);
    setResultFormVisible(true);
  }

  function handleResultSaved(result: HarvestResult, isNew: boolean) {
    setResults((prev) => (isNew ? [...prev, result] : prev.map((r) => (r.id === result.id ? result : r))));
  }

  async function confirmDeleteHarvestResult() {
    if (!confirmDeleteResult) return;
    const { id } = confirmDeleteResult;
    try {
      await deleteHarvestResult(id);
      setResults((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDeleteResult(null);
    }
  }

  const formattedDate = harvest ? (parseIsoDate(harvest.date)?.toLocaleDateString() ?? harvest.date) : '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerSide}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={Brand.dark} />
        </Pressable>
        <Text style={styles.headerTitle}>{harvest?.title ?? t('harvest.title')}</Text>
        <View style={styles.headerSide}>
          <LanguageToggle />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={Brand.dark} />
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorText}>{t('harvestItem.loadError')}</Text>
            <Pressable style={styles.retryButton} onPress={load}>
              <Text style={styles.retryButtonLabel}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {harvest ? (
              <View style={styles.landDetailsBlock}>
                <Text style={styles.cardSubtitle}>
                  {t('harvest.date')}: {formattedDate}
                </Text>
                {farm && plot ? (
                  <Text style={styles.cardSubtitle}>
                    {t('harvest.landLabel')}: {farm.name} · {cropLabel(plot.crop, t)} ({plot.area}{' '}
                    {t('farm.areaUnit')})
                  </Text>
                ) : null}

                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>{t('harvest.statusLabel')}</Text>
                <View style={styles.kindRow}>
                  {HARVEST_STATUSES.map((option) => (
                    <Pressable
                      key={option}
                      disabled={statusSaving}
                      style={[styles.kindChip, harvest.status === option && styles.kindChipActive]}
                      onPress={() => handleStatusChange(option)}>
                      <Text style={[styles.kindChipLabel, harvest.status === option && styles.kindChipLabelActive]}>
                        {t(HARVEST_STATUS_LABEL_KEY[option])}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {statusError && <Text style={styles.errorText}>{statusError}</Text>}
              </View>
            ) : null}

            {items.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>{t('harvestItem.empty')}</Text>
              </View>
            ) : (
              items.map((item) => {
                const target = targetFor(item.stockId, item.treeStockId);
                const label = target?.label ?? '';
                return (
                  <View key={item.id} style={styles.detailCard}>
                    <View style={styles.detailImagePlaceholder}>
                      {target ? (
                        <Image source={target.icon} style={styles.livestockIcon} resizeMode="contain" />
                      ) : (
                        <Ionicons name="help-outline" size={24} color={Brand.muted} />
                      )}
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailCode}>{label}</Text>
                      <Text style={styles.detailAge}>
                        {item.amount} {target?.unitLabel ?? ''}
                      </Text>
                    </View>
                    {harvest?.status !== 'Harvested' && (
                      <View style={styles.detailActions}>
                        <Pressable
                          hitSlop={8}
                          onPress={() => openEdit(item)}
                          accessibilityRole="button"
                          accessibilityLabel={t('common.edit')}>
                          <Ionicons name="pencil-outline" size={20} color={Brand.muted} />
                        </Pressable>
                        <Pressable
                          hitSlop={8}
                          onPress={() => setConfirmDelete({ id: item.id, label })}
                          accessibilityRole="button"
                          accessibilityLabel={t('common.delete')}>
                          <Ionicons name="trash-outline" size={20} color={Brand.muted} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })
            )}

            {harvest?.status !== 'Harvested' && (
              <Pressable style={styles.addButton} onPress={openAdd}>
                <Ionicons name="add" size={18} color={Brand.dark} />
                <Text style={styles.addButtonLabel}>{t('harvestItem.add')}</Text>
              </Pressable>
            )}

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>{t('harvestResult.title')}</Text>
            {results.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>{t('harvestResult.empty')}</Text>
              </View>
            ) : (
              results.map((result) => {
                const target = targetFor(result.stockId, result.treeStockId);
                const label = target?.label ?? '';
                return (
                  <View key={result.id} style={styles.detailCard}>
                    <View style={styles.detailImagePlaceholder}>
                      {target ? (
                        <Image source={target.icon} style={styles.livestockIcon} resizeMode="contain" />
                      ) : (
                        <Ionicons name="help-outline" size={24} color={Brand.muted} />
                      )}
                    </View>
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailCode}>{label}</Text>
                      <Text style={styles.detailAge}>
                        {result.amount} {target?.unitLabel ?? ''}
                      </Text>
                    </View>
                    {harvest?.status === 'Harvested' && (
                      <View style={styles.detailActions}>
                        <Pressable
                          hitSlop={8}
                          onPress={() => openEditResult(result)}
                          accessibilityRole="button"
                          accessibilityLabel={t('common.edit')}>
                          <Ionicons name="pencil-outline" size={20} color={Brand.muted} />
                        </Pressable>
                        <Pressable
                          hitSlop={8}
                          onPress={() => setConfirmDeleteResult({ id: result.id, label })}
                          accessibilityRole="button"
                          accessibilityLabel={t('common.delete')}>
                          <Ionicons name="trash-outline" size={20} color={Brand.muted} />
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })
            )}

            {harvest?.status === 'Harvested' ? (
              <Pressable style={styles.addButton} onPress={openAddResult}>
                <Ionicons name="add" size={18} color={Brand.dark} />
                <Text style={styles.addButtonLabel}>{t('harvestResult.add')}</Text>
              </Pressable>
            ) : (
              <Text style={styles.emptyHint}>{t('harvestResult.needsHarvested')}</Text>
            )}
          </>
        )}
      </ScrollView>

      <HarvestItemFormModal
        visible={formVisible}
        harvestId={harvestId}
        editingItem={editingItem}
        onClose={() => setFormVisible(false)}
        onSaved={handleSaved}
      />

      <ConfirmDeleteModal
        visible={!!confirmDelete}
        name={confirmDelete?.label ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteItem}
      />

      <HarvestResultFormModal
        visible={resultFormVisible}
        harvestId={harvestId}
        editingResult={editingResult}
        plannedItems={items}
        onClose={() => setResultFormVisible(false)}
        onSaved={handleResultSaved}
      />

      <ConfirmDeleteModal
        visible={!!confirmDeleteResult}
        name={confirmDeleteResult?.label ?? ''}
        onCancel={() => setConfirmDeleteResult(null)}
        onConfirm={confirmDeleteHarvestResult}
      />
    </SafeAreaView>
  );
}
