import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/farm/shared/action-sheet';
import { ConfirmDeleteModal } from '@/components/farm/shared/confirm-delete-modal';
import { FarmFormModal } from '@/components/farm/farm-form-modal';
import { LandCard } from '@/components/farm/land/land-card';
import { type Tab } from '@/components/farm/livestock/livestock';
import { LivestockCard } from '@/components/farm/livestock/livestock-card';
import { stockTypeLabel } from '@/components/farm/stock/stock';
import { StockCard } from '@/components/farm/stock/stock-card';
import { StockFormModal } from '@/components/farm/stock/stock-form-modal';
import { styles } from '@/components/farm/shared/styles';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { deleteFarm, getFarms } from '@/services/farm-service';
import { deleteLivestock, getLivestock } from '@/services/livestock-service';
import { deleteStock, getStock } from '@/services/stock-service';
import type { Farm } from '@/types/farm';
import type { Livestock } from '@/types/livestock';
import type { Stock } from '@/types/stock';

const TITLE_KEY: Record<Tab, string> = {
  land: 'farm.land',
  livestock: 'farm.livestock',
  stock: 'farm.stock',
};

const ADD_LABEL_KEY: Record<Tab, string> = {
  land: 'farm.addFarmland',
  livestock: 'farm.addLivestock',
  stock: 'farm.addStock',
};

const ERROR_KEY: Record<Tab, string> = {
  land: 'farm.loadError',
  livestock: 'farm.loadErrorLivestock',
  stock: 'farm.loadErrorStock',
};

type Props = { type: Tab };

export function FarmSection({ type }: Props) {
  const { t } = useLanguage();

  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [livestockLoading, setLivestockLoading] = useState(type === 'livestock');
  const [livestockError, setLivestockError] = useState<string | null>(null);

  const [land, setLand] = useState<Farm[]>([]);
  const [landLoading, setLandLoading] = useState(type !== 'stock');
  const [landError, setLandError] = useState<string | null>(null);

  const [stock, setStock] = useState<Stock[]>([]);
  const [stockLoading, setStockLoading] = useState(type === 'stock');
  const [stockError, setStockError] = useState<string | null>(null);

  const [actionSheetId, setActionSheetId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  const [formVisible, setFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Livestock | Farm | null>(null);

  const [stockFormVisible, setStockFormVisible] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);

  useEffect(() => {
    if (type === 'livestock') {
      loadLivestock();
      loadLand();
    } else if (type === 'land') {
      loadLand();
    } else {
      loadStock();
    }
  }, []);

  async function loadLivestock() {
    setLivestockLoading(true);
    setLivestockError(null);
    try {
      setLivestock(await getLivestock());
    } catch (err) {
      setLivestockError(err instanceof Error ? err.message : String(err));
    } finally {
      setLivestockLoading(false);
    }
  }

  async function loadLand() {
    setLandLoading(true);
    setLandError(null);
    try {
      setLand(await getFarms());
    } catch (err) {
      setLandError(err instanceof Error ? err.message : String(err));
    } finally {
      setLandLoading(false);
    }
  }

  async function loadStock() {
    setStockLoading(true);
    setStockError(null);
    try {
      setStock(await getStock());
    } catch (err) {
      setStockError(err instanceof Error ? err.message : String(err));
    } finally {
      setStockLoading(false);
    }
  }

  function openAddForm() {
    if (type === 'stock') {
      setEditingStock(null);
      setStockFormVisible(true);
      return;
    }
    setEditingItem(null);
    setFormVisible(true);
  }

  function openEditForm(id: number) {
    setActionSheetId(null);
    if (type === 'stock') {
      const item = stock.find((i) => i.id === id);
      if (!item) return;
      setEditingStock(item);
      setStockFormVisible(true);
      return;
    }
    const item = type === 'livestock' ? livestock.find((i) => i.id === id) : land.find((i) => i.id === id);
    if (!item) return;
    setEditingItem(item);
    setFormVisible(true);
  }

  function handleDelete(id: number) {
    setActionSheetId(null);
    if (type === 'stock') {
      const item = stock.find((i) => i.id === id);
      if (!item) return;
      setConfirmDelete({ id, name: item.name.trim() || stockTypeLabel(item.type, t) });
      return;
    }
    const item = type === 'livestock' ? livestock.find((i) => i.id === id) : land.find((i) => i.id === id);
    if (!item) return;
    setConfirmDelete({ id, name: item.name });
  }

  async function confirmDeleteItem() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      if (type === 'livestock') {
        await deleteLivestock(id);
        setLivestock((prev) => prev.filter((i) => i.id !== id));
      } else if (type === 'stock') {
        await deleteStock(id);
        setStock((prev) => prev.filter((i) => i.id !== id));
      } else {
        await deleteFarm(id);
        setLand((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (type === 'livestock') {
        setLivestockError(message);
      } else if (type === 'stock') {
        setStockError(message);
      } else {
        setLandError(message);
      }
    } finally {
      setConfirmDelete(null);
    }
  }

  function handleLivestockSaved(item: Livestock, isNew: boolean) {
    setLivestock((prev) => (isNew ? [...prev, item] : prev.map((i) => (i.id === item.id ? item : i))));
  }

  function handleLandSaved(farm: Farm, isNew: boolean) {
    setLand((prev) => (isNew ? [...prev, farm] : prev.map((f) => (f.id === farm.id ? farm : f))));
  }

  function handleStockSaved(item: Stock, isNew: boolean) {
    setStock((prev) => (isNew ? [...prev, item] : prev.map((s) => (s.id === item.id ? item : s))));
  }

  const loading = type === 'livestock' ? livestockLoading : type === 'stock' ? stockLoading : landLoading;
  const error = type === 'livestock' ? livestockError : type === 'stock' ? stockError : landError;
  const onRetry = type === 'livestock' ? loadLivestock : type === 'stock' ? loadStock : loadLand;

  let content: ReactNode;
  if (loading) {
    content = (
      <View style={styles.stateBox}>
        <ActivityIndicator color={Brand.dark} />
      </View>
    );
  } else if (error) {
    content = (
      <View style={styles.stateBox}>
        <Text style={styles.errorText}>{t(ERROR_KEY[type])}</Text>
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonLabel}>{t('common.retry')}</Text>
        </Pressable>
      </View>
    );
  } else if (type === 'livestock') {
    content = livestock.map((item) => (
      <LivestockCard
        key={item.id}
        item={item}
        farmName={land.find((f) => f.id === item.farmId)?.name}
        onMenu={() => setActionSheetId(item.id)}
        onProduction={() =>
          router.push({
            pathname: '/farm/livestock-production/[livestockId]',
            params: { livestockId: item.id, label: item.name },
          })
        }
        onPress={() => router.push({ pathname: '/farm/livestock/[id]', params: { id: item.id } })}
      />
    ));
  } else if (type === 'stock') {
    content = stock.map((item) => (
      <StockCard
        key={item.id}
        item={item}
        onMenu={() => setActionSheetId(item.id)}
        onPress={() =>
          router.push({
            pathname: '/farm/stock-history/[stockId]',
            params: { stockId: item.id, label: item.name.trim() || stockTypeLabel(item.type, t) },
          })
        }
      />
    ));
  } else {
    content = land.map((item) => (
      <LandCard
        key={item.id}
        item={item}
        onMenu={() => setActionSheetId(item.id)}
        onPress={() => router.push({ pathname: '/farm/land/[id]', params: { id: item.id } })}
      />
    ));
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
        <Text style={styles.headerTitle}>{t(TITLE_KEY[type])}</Text>
        <View style={styles.headerSide}>
          <LanguageToggle />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {content}

        <Pressable style={styles.addButton} onPress={openAddForm}>
          <Ionicons name="add" size={18} color={Brand.dark} />
          <Text style={styles.addButtonLabel}>{t(ADD_LABEL_KEY[type])}</Text>
        </Pressable>
      </ScrollView>

      <ActionSheet
        visible={actionSheetId != null}
        onEdit={() => actionSheetId != null && openEditForm(actionSheetId)}
        onDelete={() => actionSheetId != null && handleDelete(actionSheetId)}
        onClose={() => setActionSheetId(null)}
      />

      {type !== 'stock' && (
        <FarmFormModal
          visible={formVisible}
          type={type}
          editingItem={editingItem}
          farms={land}
          onClose={() => setFormVisible(false)}
          onLivestockSaved={handleLivestockSaved}
          onLandSaved={handleLandSaved}
        />
      )}

      {type === 'stock' && (
        <StockFormModal
          visible={stockFormVisible}
          editingStock={editingStock}
          onClose={() => setStockFormVisible(false)}
          onSaved={handleStockSaved}
        />
      )}

      <ConfirmDeleteModal
        visible={!!confirmDelete}
        name={confirmDelete?.name ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteItem}
      />
    </SafeAreaView>
  );
}
