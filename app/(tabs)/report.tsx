import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PRODUCTION_TYPE_LABEL_KEY, UNIT_LABEL_KEY } from '@/components/farm/livestock/production';
import { styles } from '@/components/farm/shared/styles';
import { stockKindImage, stockTypeLabel, STOCK_UNIT_LABEL_KEY } from '@/components/farm/stock/stock';
import { fruitKindImage, fruitTypeLabel, TREE_STOCK_UNIT_LABEL_KEY } from '@/components/farm/tree-stock/tree-stock';
import { HarvestReportCard, type YieldRow } from '@/components/report/harvest-report-card';
import { ProductionRecordCard, ProductionTotalCard, type ProductionTotalRow } from '@/components/report/production-report-card';
import { TotalReportCard } from '@/components/report/total-report-card';
import { DateField } from '@/components/ui/date-field';
import { parseIsoDate } from '@/components/ui/date-utils';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { getAllAnimalProductions } from '@/services/animal-production-service';
import { getFarms } from '@/services/farm-service';
import { getHarvests } from '@/services/harvest-service';
import { getHarvestResults } from '@/services/harvest-result-service';
import { getLivestockDetails } from '@/services/livestock-detail-service';
import { getLivestock } from '@/services/livestock-service';
import { getProductionTypes } from '@/services/production-type-service';
import { getStock } from '@/services/stock-service';
import { getTreeStock } from '@/services/tree-stock-service';
import { getUnits } from '@/services/unit-service';
import type { AnimalProduction } from '@/types/animal-production';
import type { Farm } from '@/types/farm';
import type { Harvest } from '@/types/harvest';
import type { HarvestResult } from '@/types/harvest-result';
import type { AnimalType, Livestock } from '@/types/livestock';
import type { LivestockDetail } from '@/types/livestock-detail';
import type { ProductionType } from '@/types/production-type';
import type { Stock } from '@/types/stock';
import type { TreeStock } from '@/types/tree-stock';
import type { Unit } from '@/types/unit';

type ReportTab = 'harvest' | 'production';
type PeriodMode = 'all' | 'year' | 'quarter' | 'custom';
type Quarter = 1 | 2 | 3 | 4;

const PERIOD_OPTIONS: { value: PeriodMode; labelKey: string }[] = [
  { value: 'all', labelKey: 'report.periodAll' },
  { value: 'year', labelKey: 'report.periodYear' },
  { value: 'quarter', labelKey: 'report.periodQuarter' },
  { value: 'custom', labelKey: 'report.periodCustom' },
];

const QUARTER_OPTIONS: { value: Quarter; labelKey: string }[] = [
  { value: 1, labelKey: 'report.quarterQ1' },
  { value: 2, labelKey: 'report.quarterQ2' },
  { value: 3, labelKey: 'report.quarterQ3' },
  { value: 4, labelKey: 'report.quarterQ4' },
];

export default function ReportScreen() {
  const { t } = useLanguage();

  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [treeStocks, setTreeStocks] = useState<TreeStock[]>([]);
  const [resultsByHarvest, setResultsByHarvest] = useState<Record<string, HarvestResult[]>>({});
  const [productions, setProductions] = useState<AnimalProduction[]>([]);
  const [productionTypes, setProductionTypes] = useState<ProductionType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [livestockDetails, setLivestockDetails] = useState<LivestockDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [tab, setTab] = useState<ReportTab>('harvest');
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('all');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [quarter, setQuarter] = useState<Quarter>(() => (Math.floor(new Date().getMonth() / 3) + 1) as Quarter);
  const [customFrom, setCustomFrom] = useState<string | null>(null);
  const [customTo, setCustomTo] = useState<string | null>(null);
  const [productionTypeFilter, setProductionTypeFilter] = useState<number | null>(null);
  const [livestockFilter, setLivestockFilter] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load(opts?: { silent?: boolean }) {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const [harvestList, farmList, stockList, treeStockList, livestockList, productionList, productionTypeList, unitList] =
        await Promise.all([
          getHarvests(),
          getFarms(),
          // Reported harvests can name a good that has since been removed, so include those rows.
          getStock(true),
          getTreeStock(),
          getLivestock(),
          getAllAnimalProductions(),
          getProductionTypes(),
          getUnits(),
        ]);
      setHarvests(harvestList);
      setFarms(farmList);
      setStocks(stockList);
      setTreeStocks(treeStockList);
      setLivestock(livestockList);
      setProductions(productionList);
      setProductionTypes(productionTypeList);
      setUnits(unitList);

      // Results only ever exist for harvests already marked Harvested (the backend enforces this),
      // so skip fetching for the rest.
      const harvestedIds = harvestList.filter((h) => h.status === 'Harvested').map((h) => h.id);
      const entries = await Promise.all(harvestedIds.map(async (id) => [id, await getHarvestResults(id)] as const));
      setResultsByHarvest(Object.fromEntries(entries));

      const detailEntries = await Promise.all(
        livestockList.map(async (l) => await getLivestockDetails(l.id))
      );
      setLivestockDetails(detailEntries.flat());
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

  function targetFor(stockId: number | null, treeStockId: number | null): { label: string; icon: number; unitLabel: string } | null {
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

  function yieldRowsFor(harvestId: number): YieldRow[] {
    const rows: YieldRow[] = [];
    for (const result of resultsByHarvest[harvestId] ?? []) {
      const target = targetFor(result.stockId, result.treeStockId);
      if (!target) continue;
      rows.push({
        key: result.stockId != null ? `s${result.stockId}` : `t${result.treeStockId}`,
        label: target.label,
        icon: target.icon,
        unitLabel: target.unitLabel,
        amount: result.amount,
      });
    }
    return rows;
  }

  function isInRange(dateIso: string): boolean {
    const date = parseIsoDate(dateIso);
    if (!date) return false;
    if (periodMode === 'year') return date.getFullYear() === year;
    if (periodMode === 'quarter') {
      return date.getFullYear() === year && Math.floor(date.getMonth() / 3) + 1 === quarter;
    }
    if (periodMode === 'custom') {
      const from = parseIsoDate(customFrom);
      const to = parseIsoDate(customTo);
      if (from && date < from) return false;
      if (to && date > to) return false;
      return true;
    }
    return true;
  }

  const filteredHarvests = useMemo(() => {
    const term = search.trim().toLowerCase();
    return harvests
      .filter((h) => h.status === 'Harvested')
      .filter((h) => isInRange(h.date))
      .filter((h) => (term ? h.title.toLowerCase().includes(term) : true))
      .sort((a, b) => b.date.localeCompare(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [harvests, search, periodMode, year, quarter, customFrom, customTo]);

  const totalExpenses = useMemo(
    () =>
      filteredHarvests.reduce(
        (sum, h) => sum + (h.equipmentCost ?? 0) + (h.workersCost ?? 0) + (h.fuelCost ?? 0) + (h.otherCost ?? 0),
        0
      ),
    [filteredHarvests]
  );

  const yieldTotals = useMemo(() => {
    const totals = new Map<string, YieldRow>();
    for (const harvest of filteredHarvests) {
      for (const row of yieldRowsFor(harvest.id)) {
        const existing = totals.get(row.key);
        if (existing) {
          existing.amount += row.amount;
        } else {
          totals.set(row.key, { ...row });
        }
      }
    }
    return Array.from(totals.values()).sort((a, b) => b.amount - a.amount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredHarvests, resultsByHarvest, stocks, treeStocks]);

  function farmNameFor(farmId: number | null): string | null {
    if (farmId == null) return null;
    return farms.find((f) => f.id === farmId)?.name ?? null;
  }

  function productionTypeLabel(productionTypeId: number): string {
    const type = productionTypes.find((pt) => pt.id === productionTypeId);
    if (!type) return '';
    return t(PRODUCTION_TYPE_LABEL_KEY[type.name] ?? type.name);
  }

  function unitLabel(unit?: Unit): string {
    if (!unit) return '';
    return t(UNIT_LABEL_KEY[unit.name] ?? unit.name);
  }

  function targetInfoFor(
    record: AnimalProduction
  ): { label: string; animalType: AnimalType | null; farmName: string | null; livestockGroupId: number | null } {
    if (record.animalId != null) {
      const detail = livestockDetails.find((d) => d.id === record.animalId);
      const group = detail ? livestock.find((l) => l.id === detail.livestockId) : undefined;
      return {
        label: detail ? `${detail.code}${group ? ` · ${group.name}` : ''}` : `#${record.animalId}`,
        animalType: group?.type ?? null,
        farmName: group ? farmNameFor(group.farmId) : null,
        livestockGroupId: group?.id ?? null,
      };
    }
    if (record.livestockId != null) {
      const group = livestock.find((l) => l.id === record.livestockId);
      return {
        label: group?.name ?? `#${record.livestockId}`,
        animalType: group?.type ?? null,
        farmName: group ? farmNameFor(group.farmId) : null,
        livestockGroupId: group?.id ?? record.livestockId,
      };
    }
    return { label: '', animalType: null, farmName: null, livestockGroupId: null };
  }

  const filteredProductions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return productions
      .filter((p) => isInRange(p.collectionDate))
      .filter((p) => productionTypeFilter == null || p.productionTypeId === productionTypeFilter)
      .filter((p) => livestockFilter == null || targetInfoFor(p).livestockGroupId === livestockFilter)
      .filter((p) => {
        if (!term) return true;
        const typeMatch = productionTypeLabel(p.productionTypeId).toLowerCase().includes(term);
        const targetMatch = targetInfoFor(p).label.toLowerCase().includes(term);
        return typeMatch || targetMatch;
      })
      .sort((a, b) => b.collectionDate.localeCompare(a.collectionDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    productions,
    search,
    periodMode,
    year,
    quarter,
    customFrom,
    customTo,
    productionTypeFilter,
    livestockFilter,
    productionTypes,
    livestock,
    livestockDetails,
  ]);

  const productionTotals = useMemo(() => {
    const totals = new Map<string, ProductionTotalRow>();
    for (const record of filteredProductions) {
      const key = `${record.productionTypeId}-${record.unitId}`;
      const unit = units.find((u) => u.id === record.unitId);
      const existing = totals.get(key);
      if (existing) {
        existing.amount += record.quantity;
      } else {
        totals.set(key, {
          key,
          label: productionTypeLabel(record.productionTypeId),
          unitLabel: unit?.shortName ?? '',
          amount: record.quantity,
        });
      }
    }
    return Array.from(totals.values()).sort((a, b) => b.amount - a.amount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProductions, productionTypes, units]);

  const totalProductionValue = useMemo(
    () =>
      filteredProductions.reduce(
        (sum, p) => sum + (p.totalPrice ?? (p.pricePerUnit != null ? p.quantity * p.pricePerUnit : 0)),
        0
      ),
    [filteredProductions]
  );

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
        <Text style={styles.headerTitle}>{t('report.title')}</Text>
        <View style={styles.headerSide}>
          <LanguageToggle />
        </View>
      </View>

      <View style={styles.tabRow}>
        <Pressable style={styles.tabItem} onPress={() => setTab('harvest')}>
          <Text style={[styles.tabLabel, tab === 'harvest' && styles.tabLabelActive]}>
            {t('report.harvestTab')}
          </Text>
          {tab === 'harvest' && <View style={styles.tabIndicator} />}
        </Pressable>
        <Pressable style={styles.tabItem} onPress={() => setTab('production')}>
          <Text style={[styles.tabLabel, tab === 'production' && styles.tabLabelActive]}>
            {t('report.productionTab')}
          </Text>
          {tab === 'production' && <View style={styles.tabIndicator} />}
        </Pressable>
      </View>

      <View style={local.searchRow}>
        <View style={local.searchField}>
          <Ionicons name="search" size={18} color={Brand.muted} />
          <TextInput
            style={local.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={t(tab === 'harvest' ? 'report.searchPlaceholder' : 'report.searchPlaceholderProduction')}
            placeholderTextColor={Brand.muted}
          />
        </View>
        <Pressable
          style={[local.filterButton, filtersOpen && local.filterButtonActive]}
          onPress={() => setFiltersOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('report.filtersLabel')}>
          <Ionicons name="options-outline" size={20} color={filtersOpen ? '#FFFFFF' : Brand.dark} />
        </Pressable>
      </View>

      <Modal visible={filtersOpen} transparent animationType="slide" onRequestClose={() => setFiltersOpen(false)}>
        <View style={styles.formOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setFiltersOpen(false)} />
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{t('report.filtersLabel')}</Text>

            <ScrollView style={styles.formScrollArea} showsVerticalScrollIndicator>
              <View style={local.filterRow}>
                {PERIOD_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={[styles.kindChip, periodMode === opt.value && styles.kindChipActive]}
                    onPress={() => setPeriodMode(opt.value)}>
                    <Text style={[styles.kindChipLabel, periodMode === opt.value && styles.kindChipLabelActive]}>
                      {t(opt.labelKey)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {(periodMode === 'year' || periodMode === 'quarter') && (
                <View style={local.yearRow}>
                  <Pressable
                    hitSlop={8}
                    onPress={() => setYear((y) => y - 1)}
                    accessibilityRole="button"
                    accessibilityLabel="Previous year">
                    <Ionicons name="chevron-back" size={20} color={Brand.dark} />
                  </Pressable>
                  <Text style={local.yearText}>{year}</Text>
                  <Pressable
                    hitSlop={8}
                    onPress={() => setYear((y) => y + 1)}
                    accessibilityRole="button"
                    accessibilityLabel="Next year">
                    <Ionicons name="chevron-forward" size={20} color={Brand.dark} />
                  </Pressable>
                </View>
              )}

              {periodMode === 'quarter' && (
                <View style={local.filterRow}>
                  {QUARTER_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.value}
                      style={[styles.kindChip, quarter === opt.value && styles.kindChipActive]}
                      onPress={() => setQuarter(opt.value)}>
                      <Text style={[styles.kindChipLabel, quarter === opt.value && styles.kindChipLabelActive]}>
                        {t(opt.labelKey)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {periodMode === 'custom' && (
                <View style={local.customRangeRow}>
                  <View style={local.customRangeField}>
                    <Text style={styles.fieldLabel}>{t('report.fromDate')}</Text>
                    <DateField value={customFrom} onChange={setCustomFrom} placeholder={t('report.selectDate')} />
                  </View>
                  <View style={local.customRangeField}>
                    <Text style={styles.fieldLabel}>{t('report.toDate')}</Text>
                    <DateField value={customTo} onChange={setCustomTo} placeholder={t('report.selectDate')} />
                  </View>
                </View>
              )}

              {tab === 'production' && (
                <>
                  <Text style={local.filterSectionLabel}>{t('report.productTypeFilterLabel')}</Text>
                  <View style={local.filterRow}>
                    <Pressable
                      style={[styles.kindChip, productionTypeFilter == null && styles.kindChipActive]}
                      onPress={() => setProductionTypeFilter(null)}>
                      <Text style={[styles.kindChipLabel, productionTypeFilter == null && styles.kindChipLabelActive]}>
                        {t('report.filterAll')}
                      </Text>
                    </Pressable>
                    {productionTypes.map((pt) => (
                      <Pressable
                        key={pt.id}
                        style={[styles.kindChip, productionTypeFilter === pt.id && styles.kindChipActive]}
                        onPress={() => setProductionTypeFilter(pt.id)}>
                        <Text
                          style={[
                            styles.kindChipLabel,
                            productionTypeFilter === pt.id && styles.kindChipLabelActive,
                          ]}>
                          {productionTypeLabel(pt.id)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={local.filterSectionLabel}>{t('report.livestockFilterLabel')}</Text>
                  <View style={local.filterRow}>
                    <Pressable
                      style={[styles.kindChip, livestockFilter == null && styles.kindChipActive]}
                      onPress={() => setLivestockFilter(null)}>
                      <Text style={[styles.kindChipLabel, livestockFilter == null && styles.kindChipLabelActive]}>
                        {t('report.filterAll')}
                      </Text>
                    </Pressable>
                    {livestock.map((l) => (
                      <Pressable
                        key={l.id}
                        style={[styles.kindChip, livestockFilter === l.id && styles.kindChipActive]}
                        onPress={() => setLivestockFilter(l.id)}>
                        <Text style={[styles.kindChipLabel, livestockFilter === l.id && styles.kindChipLabelActive]}>
                          {l.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.formActions}>
              <Pressable style={styles.formSubmitButton} onPress={() => setFiltersOpen(false)}>
                <Text style={styles.formSubmitLabel}>{t('common.done')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.dark} />}>
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={Brand.dark} />
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorText}>{t('report.loadError')}</Text>
            <Pressable style={styles.retryButton} onPress={() => load()}>
              <Text style={styles.retryButtonLabel}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : tab === 'harvest' ? (
          harvests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{t('report.empty')}</Text>
            </View>
          ) : filteredHarvests.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>{t('report.noResults')}</Text>
            </View>
          ) : (
            <>
              <TotalReportCard harvestsCount={filteredHarvests.length} totalExpenses={totalExpenses} yieldRows={yieldTotals} />
              {filteredHarvests.map((harvest) => (
                <HarvestReportCard
                  key={harvest.id}
                  harvest={harvest}
                  farmName={farmNameFor(harvest.farmId)}
                  totalExpenses={
                    (harvest.equipmentCost ?? 0) + (harvest.workersCost ?? 0) + (harvest.fuelCost ?? 0) + (harvest.otherCost ?? 0)
                  }
                  yieldRows={yieldRowsFor(harvest.id)}
                  onPress={() => router.push({ pathname: '/harvest/detail/[id]', params: { id: harvest.id } })}
                />
              ))}
            </>
          )
        ) : productions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('report.emptyProduction')}</Text>
          </View>
        ) : filteredProductions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('report.noResultsProduction')}</Text>
          </View>
        ) : (
          <>
            <ProductionTotalCard
              recordsCount={filteredProductions.length}
              totalValue={totalProductionValue}
              rows={productionTotals}
            />
            {filteredProductions.map((record) => {
              const target = targetInfoFor(record);
              const unit = units.find((u) => u.id === record.unitId);
              return (
                <ProductionRecordCard
                  key={record.id}
                  animalType={target.animalType}
                  productLabel={productionTypeLabel(record.productionTypeId)}
                  targetLabel={target.label}
                  farmName={target.farmName}
                  collectionDate={record.collectionDate}
                  quantity={record.quantity}
                  unitLabel={unitLabel(unit)}
                  unitShortName={unit?.shortName ?? ''}
                  totalPrice={record.totalPrice ?? (record.pricePerUnit != null ? record.quantity * record.pricePerUnit : null)}
                  onPress={() =>
                    record.animalId != null
                      ? router.push({
                          pathname: '/farm/production/[animalId]',
                          params: { animalId: record.animalId, label: target.label },
                        })
                      : record.livestockId != null
                        ? router.push({
                            pathname: '/farm/livestock-production/[livestockId]',
                            params: { livestockId: record.livestockId, label: target.label },
                          })
                        : undefined
                  }
                />
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const local = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Brand.dark,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: Brand.green,
    borderColor: Brand.green,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  filterSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.dark,
    marginBottom: 6,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 12,
  },
  yearText: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.dark,
    minWidth: 56,
    textAlign: 'center',
  },
  customRangeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  customRangeField: {
    flex: 1,
  },
});
