import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/farm/shared/action-sheet';
import { ConfirmDeleteModal } from '@/components/farm/shared/confirm-delete-modal';
import { styles } from '@/components/farm/shared/styles';
import { HarvestCard } from '@/components/harvest/harvest-card';
import { isOverdue } from '@/components/harvest/harvest-analysis';
import { HarvestFormModal } from '@/components/harvest/harvest-form-modal';
import { HARVEST_STATUS_LABEL_KEY, HARVEST_STATUSES } from '@/components/harvest/status';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { deleteHarvest, getHarvests } from '@/services/harvest-service';
import type { Harvest, HarvestStatus } from '@/types/harvest';

type SortOrder = 'dateDesc' | 'dateAsc' | 'titleAsc' | 'expectedAsc';

const SORT_OPTIONS: { value: SortOrder; labelKey: string }[] = [
  { value: 'dateDesc', labelKey: 'harvest.sortNewest' },
  { value: 'dateAsc', labelKey: 'harvest.sortOldest' },
  { value: 'titleAsc', labelKey: 'harvest.sortTitle' },
  { value: 'expectedAsc', labelKey: 'harvest.sortExpected' },
];

export default function HarvestScreen() {
  const { t } = useLanguage();

  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<HarvestStatus | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('dateDesc');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const [actionSheetId, setActionSheetId] = useState<number | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState<Harvest | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; title: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load(opts?: { silent?: boolean }) {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      setHarvests(await getHarvests());
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

  function openAdd() {
    setEditingHarvest(null);
    setFormVisible(true);
  }

  function openEdit(id: number) {
    setActionSheetId(null);
    const item = harvests.find((h) => h.id === id);
    if (!item) return;
    setEditingHarvest(item);
    setFormVisible(true);
  }

  function handleDelete(id: number) {
    setActionSheetId(null);
    const item = harvests.find((h) => h.id === id);
    if (!item) return;
    setConfirmDelete({ id, title: item.title });
  }

  async function confirmDeleteHarvest() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteHarvest(id);
      setHarvests((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  function handleSaved(harvest: Harvest, isNew: boolean) {
    setHarvests((prev) => (isNew ? [harvest, ...prev] : prev.map((h) => (h.id === harvest.id ? harvest : h))));
  }

  const overdueCount = harvests.filter((h) => isOverdue(h)).length;

  const visibleHarvests = harvests
    .filter((h) => (statusFilter ? h.status === statusFilter : true))
    .filter((h) => (overdueOnly ? isOverdue(h) : true))
    .filter((h) => {
      const term = search.trim().toLowerCase();
      return term ? h.title.toLowerCase().includes(term) : true;
    })
    .sort((a, b) => {
      if (sortOrder === 'dateAsc') return a.date.localeCompare(b.date);
      if (sortOrder === 'titleAsc') return a.title.localeCompare(b.title);
      if (sortOrder === 'expectedAsc') {
        // Harvests without an expected date sort last rather than jumping to the front.
        if (a.expectedHarvestDate == null) return b.expectedHarvestDate == null ? 0 : 1;
        if (b.expectedHarvestDate == null) return -1;
        return a.expectedHarvestDate.localeCompare(b.expectedHarvestDate);
      }
      return b.date.localeCompare(a.date);
    });

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
        <Text style={styles.headerTitle}>{t('harvest.title')}</Text>
        <View style={styles.headerSide}>
          <LanguageToggle />
        </View>
      </View>

      <View style={local.searchRow}>
        <View style={local.searchField}>
          <Ionicons name="search" size={18} color={Brand.muted} />
          <TextInput
            style={local.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={t('harvest.searchPlaceholder')}
            placeholderTextColor={Brand.muted}
          />
        </View>
        <Pressable
          style={[local.filterButton, filtersOpen && local.filterButtonActive]}
          onPress={() => setFiltersOpen((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={t('harvest.filtersLabel')}>
          <Ionicons name="options-outline" size={20} color={filtersOpen ? '#FFFFFF' : Brand.dark} />
        </Pressable>
      </View>

      {filtersOpen && (
        <>
          <View style={local.filterRow}>
            <Pressable
              style={[styles.kindChip, statusFilter == null && styles.kindChipActive]}
              onPress={() => setStatusFilter(null)}>
              <Text style={[styles.kindChipLabel, statusFilter == null && styles.kindChipLabelActive]}>
                {t('harvest.filterAll')}
              </Text>
            </Pressable>
            {HARVEST_STATUSES.map((status) => (
              <Pressable
                key={status}
                style={[styles.kindChip, statusFilter === status && styles.kindChipActive]}
                onPress={() => setStatusFilter(status)}>
                <Text style={[styles.kindChipLabel, statusFilter === status && styles.kindChipLabelActive]}>
                  {t(HARVEST_STATUS_LABEL_KEY[status])}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.kindChip, overdueOnly && styles.kindChipActive]}
              onPress={() => setOverdueOnly((prev) => !prev)}>
              <Text style={[styles.kindChipLabel, overdueOnly && styles.kindChipLabelActive]}>
                {t('harvest.filterOverdue')}
                {overdueCount > 0 ? ` (${overdueCount})` : ''}
              </Text>
            </Pressable>
          </View>
          <View style={local.filterRow}>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.kindChip, sortOrder === opt.value && styles.kindChipActive]}
                onPress={() => setSortOrder(opt.value)}>
                <Text style={[styles.kindChipLabel, sortOrder === opt.value && styles.kindChipLabelActive]}>
                  {t(opt.labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.dark} />}>
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={Brand.dark} />
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorText}>{t('harvest.loadError')}</Text>
            <Pressable style={styles.retryButton} onPress={() => load()}>
              <Text style={styles.retryButtonLabel}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : harvests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('harvest.empty')}</Text>
          </View>
        ) : visibleHarvests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('harvest.noResults')}</Text>
          </View>
        ) : (
          visibleHarvests.map((item) => (
            <HarvestCard
              key={item.id}
              item={item}
              onMenu={() => setActionSheetId(item.id)}
              onPress={() => router.push({ pathname: '/harvest/detail/[id]', params: { id: item.id } })}
            />
          ))
        )}

        <Pressable style={styles.addButton} onPress={openAdd}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addButtonLabel}>{t('harvest.add')}</Text>
        </Pressable>
      </ScrollView>

      <ActionSheet
        visible={actionSheetId != null}
        onEdit={() => actionSheetId != null && openEdit(actionSheetId)}
        onDelete={() => actionSheetId != null && handleDelete(actionSheetId)}
        onClose={() => setActionSheetId(null)}
      />

      <HarvestFormModal
        visible={formVisible}
        editingHarvest={editingHarvest}
        onClose={() => setFormVisible(false)}
        onSaved={handleSaved}
      />

      <ConfirmDeleteModal
        visible={!!confirmDelete}
        name={confirmDelete?.title ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteHarvest}
      />
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
    paddingHorizontal: 20,
    marginBottom: 12,
  },
});
