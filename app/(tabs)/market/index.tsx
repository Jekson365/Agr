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
import { ListingCard } from '@/components/market/listing-card';
import { ListingFormModal } from '@/components/market/listing-form-modal';
import { LISTING_CATEGORY_OPTIONS, listingItemLabel } from '@/components/market/market-listing';
import { CurrencyToggle } from '@/components/ui/currency-toggle';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { deleteMarketListing, getMarketListings, updateMarketListing } from '@/services/market-listing-service';
import type { ListingCategory, MarketListing } from '@/types/market-listing';

type Tab = 'buy' | 'rent' | 'mine';

const TAB_LABEL_KEY: Record<Tab, string> = {
  buy: 'market.tabBuy',
  rent: 'market.tabRent',
  mine: 'market.tabMine',
};

export default function MarketScreen() {
  const { t } = useLanguage();

  const [tab, setTab] = useState<Tab>('buy');
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [category, setCategory] = useState<ListingCategory | null>(null);

  const [actionSheetId, setActionSheetId] = useState<number | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingListing, setEditingListing] = useState<MarketListing | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, category])
  );

  async function load(opts?: { silent?: boolean }) {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const result = await getMarketListings({
        type: tab === 'rent' ? 'Rent' : tab === 'buy' ? 'Sale' : undefined,
        category: category ?? undefined,
        mine: tab === 'mine',
      });
      setListings(result);
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

  const visibleListings = listings.filter((item) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    const label = listingItemLabel(item.category, item.itemType, t).toLowerCase();
    return item.title.toLowerCase().includes(term) || label.includes(term);
  });

  function openAdd() {
    setEditingListing(null);
    setFormVisible(true);
  }

  function openDetails(id: number) {
    router.push({ pathname: '/market/[id]', params: { id } });
  }

  function openEdit(id: number) {
    setActionSheetId(null);
    const item = listings.find((l) => l.id === id);
    if (!item) return;
    setEditingListing(item);
    setFormVisible(true);
  }

  function handleDelete(id: number) {
    setActionSheetId(null);
    const item = listings.find((l) => l.id === id);
    if (!item) return;
    setConfirmDelete({ id, name: item.title.trim() || listingItemLabel(item.category, item.itemType, t) });
  }

  async function confirmDeleteListing() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteMarketListing(id);
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  function handleSaved(listing: MarketListing, isNew: boolean) {
    setListings((prev) => (isNew ? [listing, ...prev] : prev.map((l) => (l.id === listing.id ? listing : l))));
  }

  async function handleToggleStatus(item: MarketListing) {
    const updated: MarketListing = { ...item, status: item.status === 'Active' ? 'Completed' : 'Active' };
    try {
      await updateMarketListing(updated.id, updated);
      setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerSide} />
        <Text style={styles.headerTitle}>{t('market.title')}</Text>
        <View style={[styles.headerSide, local.headerActions]}>
          <CurrencyToggle />
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
            placeholder={t('market.searchPlaceholder')}
            placeholderTextColor={Brand.muted}
          />
        </View>
        <Pressable
          style={[local.filterButton, filtersOpen && local.filterButtonActive]}
          onPress={() => setFiltersOpen((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={t('market.categoryLabel')}>
          <Ionicons name="options-outline" size={20} color={filtersOpen ? '#FFFFFF' : Brand.dark} />
        </Pressable>
      </View>

      {filtersOpen && (
        <View style={local.filterRow}>
          <Pressable
            style={[styles.kindChip, category == null && styles.kindChipActive]}
            onPress={() => setCategory(null)}>
            <Text style={[styles.kindChipLabel, category == null && styles.kindChipLabelActive]}>
              {t('market.categoryAll')}
            </Text>
          </Pressable>
          {LISTING_CATEGORY_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[styles.kindChip, category === opt.value && styles.kindChipActive]}
              onPress={() => setCategory(opt.value)}>
              <Text style={[styles.kindChipLabel, category === opt.value && styles.kindChipLabelActive]}>
                {t(opt.labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.tabRow}>
        {(['buy', 'rent', 'mine'] as Tab[]).map((key) => (
          <Pressable key={key} style={styles.tabItem} onPress={() => setTab(key)}>
            <Text style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>{t(TAB_LABEL_KEY[key])}</Text>
            {tab === key && <View style={styles.tabIndicator} />}
          </Pressable>
        ))}
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
            <Text style={styles.errorText}>{t('market.loadError')}</Text>
            <Pressable style={styles.retryButton} onPress={() => load()}>
              <Text style={styles.retryButtonLabel}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : visibleListings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{tab === 'mine' ? t('market.emptyMine') : t('market.empty')}</Text>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {visibleListings.map((item) => (
              <ListingCard
                key={item.id}
                item={item}
                onPress={() => openDetails(item.id)}
                onMenu={tab === 'mine' ? () => setActionSheetId(item.id) : undefined}
                onToggleStatus={tab === 'mine' ? () => handleToggleStatus(item) : undefined}
              />
            ))}
          </View>
        )}

        <Pressable style={styles.addButton} onPress={openAdd}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addButtonLabel}>{t('market.add')}</Text>
        </Pressable>
      </ScrollView>

      <ActionSheet
        visible={actionSheetId != null}
        onEdit={() => actionSheetId != null && openEdit(actionSheetId)}
        onDelete={() => actionSheetId != null && handleDelete(actionSheetId)}
        onClose={() => setActionSheetId(null)}
      />

      <ListingFormModal
        visible={formVisible}
        editingListing={editingListing}
        onClose={() => setFormVisible(false)}
        onSaved={handleSaved}
      />

      <ConfirmDeleteModal
        visible={!!confirmDelete}
        name={confirmDelete?.name ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteListing}
      />
    </SafeAreaView>
  );
}

const local = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
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
