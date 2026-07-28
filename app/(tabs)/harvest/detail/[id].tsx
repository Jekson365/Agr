import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDeleteModal } from '@/components/farm/shared/confirm-delete-modal';
import { ConfirmModal } from '@/components/farm/shared/confirm-modal';
import { cropLabel } from '@/components/farm/land/crop';
import { stockKindImage, stockTypeLabel, STOCK_UNIT_LABEL_KEY } from '@/components/farm/stock/stock';
import { styles } from '@/components/farm/shared/styles';
import { fruitKindImage, fruitTypeLabel, TREE_STOCK_UNIT_LABEL_KEY } from '@/components/farm/tree-stock/tree-stock';
import { HarvestExpensesModal } from '@/components/harvest/harvest-expenses-modal';
import { HarvestItemFormModal } from '@/components/harvest/harvest-item-form-modal';
import { HarvestResultFormModal } from '@/components/harvest/harvest-result-form-modal';
import {
  buildYieldRows,
  computeEconomics,
  daysUntilExpected,
  isApplyingTransition,
  isDestructiveTransition,
  isOverdue,
  type YieldRow,
} from '@/components/harvest/harvest-analysis';
import { HARVEST_STATUS_LABEL_KEY, HARVEST_STATUSES } from '@/components/harvest/status';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { Brand } from '@/constants/theme';
import { useCurrency } from '@/contexts/currency-context';
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

/** Trims derived ratios to 2 decimals without printing trailing zeros (12.5, not 12.50). */
function round2(value: number): string {
  return String(Math.round(value * 100) / 100);
}

export default function HarvestDetailScreen() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
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
  const [refreshing, setRefreshing] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<HarvestStatus | null>(null);
  const [expensesVisible, setExpensesVisible] = useState(false);

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

  async function load(opts?: { silent?: boolean }) {
    if (!opts?.silent) setLoading(true);
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

      setFarm(item.farmId != null ? await getFarm(item.farmId) : null);
      setPlot(item.landPlotId != null ? await getLandPlot(item.landPlotId) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (!opts?.silent) setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    load({ silent: true });
  }

  function requestStatusChange(status: HarvestStatus) {
    if (!harvest || status === harvest.status || statusSaving) return;
    setPendingStatus(status);
  }

  async function confirmStatusChange() {
    if (!harvest || pendingStatus == null) return;

    const updated: Harvest = { ...harvest, status: pendingStatus };
    setStatusSaving(true);
    setStatusError(null);
    try {
      await updateHarvest(harvest.id, updated);
      setHarvest(updated);
    } catch {
      setStatusError(t('farm.saveError'));
    } finally {
      setStatusSaving(false);
      setPendingStatus(null);
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

  const formattedDate = harvest ? formatLocalizedIsoDate(harvest.date, language) : '';

  /** The raw unit a good is measured in (e.g. 'Kilogram'), for the mixed-unit check. */
  function rawUnitFor(stockId: number | null, treeStockId: number | null): string | null {
    if (stockId != null) return stocks.find((s) => s.id === stockId)?.unit ?? null;
    if (treeStockId != null) return treeStocks.find((s) => s.id === treeStockId)?.unit ?? null;
    return null;
  }

  // Planned (HarvestItem) against actual (HarvestResult), paired by good.
  const yieldRows = useMemo(() => buildYieldRows(items, results), [items, results]);
  const hasComparison = yieldRows.some((row) => row.actual > 0);

  const economics = useMemo(
    () =>
      harvest
        ? computeEconomics(harvest, yieldRows, (row) => rawUnitFor(row.stockId, row.treeStockId), plot?.area ?? null)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [harvest, yieldRows, stocks, treeStocks, plot]
  );

  const totalExpenses = economics?.totalExpenses ?? 0;
  const revenue = economics?.revenue ?? 0;
  const netTotal = economics?.net ?? 0;

  const economicsUnitLabel = (() => {
    const row = yieldRows.find((r) => r.actual > 0);
    return row ? (targetFor(row.stockId, row.treeStockId)?.unitLabel ?? '') : '';
  })();

  const overdue = harvest ? isOverdue(harvest) : false;
  const daysLeft = harvest ? daysUntilExpected(harvest) : null;

  // A status change that writes or reverses stock says so with real numbers, rather than the
  // generic "this will update the status" — reversing is the one move that silently rewrites
  // data outside this harvest.
  const recordedCount = results.length;
  const statusChangeBody = (() => {
    if (!harvest || pendingStatus == null) return t('harvest.statusConfirmBody');

    if (isApplyingTransition(harvest.status, pendingStatus)) {
      return recordedCount === 0
        ? t('harvest.statusConfirmBodyToHarvestedEmpty')
        : t('harvest.statusConfirmBodyToHarvestedCount', { count: recordedCount });
    }
    if (isDestructiveTransition(harvest.status, pendingStatus)) {
      return recordedCount === 0
        ? t('harvest.statusConfirmBodyFromHarvested')
        : t('harvest.statusConfirmBodyFromHarvestedCount', { count: recordedCount });
    }
    return t('harvest.statusConfirmBody');
  })();

  const statusChangeDestructive =
    harvest != null && pendingStatus != null && isDestructiveTransition(harvest.status, pendingStatus);

  function variancePctLabel(row: YieldRow): string {
    if (row.varianceRatio == null) return '—';
    const pct = Math.round(row.varianceRatio * 100);
    return `${pct > 0 ? '+' : ''}${pct}%`;
  }

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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.dark} />}>
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={Brand.dark} />
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorText}>{t('harvestItem.loadError')}</Text>
            <Pressable style={styles.retryButton} onPress={() => load()}>
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
                {harvest.expectedHarvestDate ? (
                  <View style={local.expectedRow}>
                    <Text style={styles.cardSubtitle}>
                      {t('harvest.expectedDate')}: {formatLocalizedIsoDate(harvest.expectedHarvestDate, language)}
                    </Text>
                    {overdue ? (
                      <View style={local.overdueBadge}>
                        <Text style={local.overdueBadgeText}>{t('harvest.overdueBy', { days: Math.abs(daysLeft ?? 0) })}</Text>
                      </View>
                    ) : harvest.status !== 'Harvested' && daysLeft != null ? (
                      <View style={local.dueBadge}>
                        <Text style={local.dueBadgeText}>{t('harvest.dueIn', { days: daysLeft })}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
                {farm ? (
                  <Text style={styles.cardSubtitle}>
                    {t('harvest.landLabel')}: {farm.name}
                    {plot ? ` · ${cropLabel(plot.crop, t)} (${plot.area} ${t('farm.areaUnit')})` : ''}
                  </Text>
                ) : null}

                {economics && (revenue > 0 || totalExpenses > 0 || economics.totalYield > 0) ? (
                  <View style={local.kpiGrid}>
                    {economics.totalYield > 0 ? (
                      <View style={local.kpiCard}>
                        <Text style={local.kpiLabel}>{t('harvest.kpiTotalYield')}</Text>
                        <Text style={local.kpiValue}>
                          {economics.unit ? `${round2(economics.totalYield)} ${economicsUnitLabel}` : t('harvest.kpiMixedUnits')}
                        </Text>
                      </View>
                    ) : null}
                    {economics.yieldPerArea != null ? (
                      <View style={local.kpiCard}>
                        <Text style={local.kpiLabel}>{t('harvest.kpiYieldPerArea')}</Text>
                        <Text style={local.kpiValue}>
                          {round2(economics.yieldPerArea)} {economicsUnitLabel}/{t('farm.areaUnit')}
                        </Text>
                      </View>
                    ) : null}
                    {revenue > 0 ? (
                      <View style={local.kpiCard}>
                        <Text style={local.kpiLabel}>{t('harvest.revenueLabel')}</Text>
                        <Text style={local.kpiValue}>{formatPrice(revenue)}</Text>
                      </View>
                    ) : null}
                    {totalExpenses > 0 ? (
                      <View style={local.kpiCard}>
                        <Text style={local.kpiLabel}>{t('harvest.expensesTotal')}</Text>
                        <Text style={local.kpiValue}>{formatPrice(totalExpenses)}</Text>
                      </View>
                    ) : null}
                    {revenue > 0 || totalExpenses > 0 ? (
                      <View style={local.kpiCard}>
                        <Text style={local.kpiLabel}>{t('harvest.netTotal')}</Text>
                        <Text style={[local.kpiValue, netTotal < 0 ? local.kpiNegative : local.kpiPositive]}>
                          {formatPrice(netTotal)}
                        </Text>
                      </View>
                    ) : null}
                    {economics.costPerUnit != null ? (
                      <View style={local.kpiCard}>
                        <Text style={local.kpiLabel}>{t('harvest.kpiCostPerUnit', { unit: economicsUnitLabel })}</Text>
                        <Text style={local.kpiValue}>{formatPrice(economics.costPerUnit)}</Text>
                      </View>
                    ) : null}
                    {economics.revenuePerUnit != null ? (
                      <View style={local.kpiCard}>
                        <Text style={local.kpiLabel}>{t('harvest.kpiRevenuePerUnit', { unit: economicsUnitLabel })}</Text>
                        <Text style={local.kpiValue}>{formatPrice(economics.revenuePerUnit)}</Text>
                      </View>
                    ) : null}
                    {economics.netPerArea != null ? (
                      <View style={local.kpiCard}>
                        <Text style={local.kpiLabel}>{t('harvest.kpiNetPerArea', { unit: t('farm.areaUnit') })}</Text>
                        <Text style={[local.kpiValue, economics.netPerArea < 0 ? local.kpiNegative : local.kpiPositive]}>
                          {formatPrice(economics.netPerArea)}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                {economics && economics.unit == null && economics.totalYield > 0 ? (
                  <Text style={styles.emptyHint}>{t('harvest.kpiMixedUnitsHint')}</Text>
                ) : null}

                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>{t('harvest.statusLabel')}</Text>
                <View style={styles.kindRow}>
                  {HARVEST_STATUSES.map((option) => (
                    <Pressable
                      key={option}
                      disabled={statusSaving}
                      style={[styles.kindChip, harvest.status === option && styles.kindChipActive]}
                      onPress={() => requestStatusChange(option)}>
                      <Text style={[styles.kindChipLabel, harvest.status === option && styles.kindChipLabelActive]}>
                        {t(HARVEST_STATUS_LABEL_KEY[option])}
                      </Text>
                    </Pressable>
                  ))}
                  {harvest.status === 'Harvested' && (
                    <Pressable
                      style={local.expensesButton}
                      onPress={() => setExpensesVisible(true)}
                      accessibilityRole="button"
                      accessibilityLabel={t('harvest.expensesTitle')}>
                      <Ionicons name="cash-outline" size={16} color="#FFFFFF" />
                    </Pressable>
                  )}
                </View>
                {statusError && <Text style={styles.errorText}>{statusError}</Text>}
              </View>
            ) : null}

            {hasComparison ? (
              <>
                <Text style={[styles.fieldLabel, { marginTop: 20 }]}>{t('harvest.comparisonTitle')}</Text>
                <View style={local.comparison}>
                  <View style={[local.comparisonRow, local.comparisonHeader]}>
                    <Text style={[local.comparisonGoodText, local.comparisonHeaderText]}>{t('harvest.comparisonGood')}</Text>
                    <Text style={[local.comparisonNum, local.comparisonHeaderText]}>{t('harvest.comparisonPlanned')}</Text>
                    <Text style={[local.comparisonNum, local.comparisonHeaderText]}>{t('harvest.comparisonActual')}</Text>
                    <Text style={[local.comparisonNum, local.comparisonHeaderText]}>{t('harvest.comparisonVariance')}</Text>
                  </View>
                  {yieldRows.map((row) => {
                    const target = targetFor(row.stockId, row.treeStockId);
                    const varianceStyle =
                      row.variance > 0 ? local.varianceUp : row.variance < 0 ? local.varianceDown : undefined;

                    return (
                      <View key={row.key} style={local.comparisonRow}>
                        <View style={local.comparisonGood}>
                          {target ? <Image source={target.icon} style={local.comparisonIcon} resizeMode="contain" /> : null}
                          <Text style={local.comparisonGoodText} numberOfLines={2}>
                            {target?.label ?? ''}
                          </Text>
                        </View>
                        <Text style={local.comparisonNum}>{row.planned > 0 ? round2(row.planned) : '—'}</Text>
                        <Text style={local.comparisonNum}>{row.actual > 0 ? round2(row.actual) : '—'}</Text>
                        <Text style={[local.comparisonNum, varianceStyle]}>
                          {row.planned === 0 && row.actual === 0
                            ? '—'
                            : `${row.variance > 0 ? '+' : ''}${round2(row.variance)}\n${variancePctLabel(row)}`}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </>
            ) : null}

            <Text style={[styles.fieldLabel, { marginTop: 20 }]}>{t('harvest.plannedTitle')}</Text>
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
                <Ionicons name="add" size={18} color="#FFFFFF" />
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
                <Ionicons name="add" size={18} color="#FFFFFF" />
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

      <ConfirmModal
        visible={pendingStatus != null}
        title={t('harvest.statusConfirmTitle', {
          status: pendingStatus ? t(HARVEST_STATUS_LABEL_KEY[pendingStatus]) : '',
        })}
        body={statusChangeBody}
        destructive={statusChangeDestructive}
        onCancel={() => setPendingStatus(null)}
        onConfirm={confirmStatusChange}
      />

      {harvest && (
        <HarvestExpensesModal
          visible={expensesVisible}
          harvest={harvest}
          onClose={() => setExpensesVisible(false)}
          onSaved={setHarvest}
        />
      )}
    </SafeAreaView>
  );
}

const local = StyleSheet.create({
  expensesButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Brand.green,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Expected pick date
  expectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  overdueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  overdueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  dueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: Brand.greenMuted,
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.green,
  },

  // Normalized economics
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  kpiCard: {
    flexGrow: 1,
    flexBasis: '45%',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Brand.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Brand.dark,
  },
  kpiPositive: {
    color: Brand.green,
  },
  kpiNegative: {
    color: '#DC2626',
  },

  // Planned vs actual
  comparison: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
  comparisonHeader: {
    backgroundColor: Brand.greenMuted,
    borderTopWidth: 0,
  },
  comparisonHeaderText: {
    fontSize: 10,
    fontWeight: '700',
    color: Brand.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  comparisonGood: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  comparisonGoodText: {
    flex: 2,
    fontSize: 12,
    color: Brand.dark,
  },
  comparisonIcon: {
    width: 20,
    height: 20,
  },
  comparisonNum: {
    flex: 1,
    fontSize: 12,
    textAlign: 'right',
    color: Brand.dark,
  },
  varianceUp: {
    color: Brand.green,
    fontWeight: '700',
  },
  varianceDown: {
    color: '#DC2626',
    fontWeight: '700',
  },
});
