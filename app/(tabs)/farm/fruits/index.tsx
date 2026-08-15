import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/farm/shared/action-sheet';
import { ConfirmDeleteModal } from '@/components/farm/shared/confirm-delete-modal';
import { styles } from '@/components/farm/shared/styles';
import { treeStockLabel } from '@/components/farm/tree-stock/tree-stock';
import { TreeStockCard } from '@/components/farm/tree-stock/tree-stock-card';
import { TreeStockFormModal } from '@/components/farm/tree-stock/tree-stock-form-modal';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { isAtLimit, isOverLimit } from '@/constants/plan-benefits';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { deleteTreeStock, getTreeStock } from '@/services/tree-stock-service';
import type { TreeStock } from '@/types/tree-stock';

export default function FruitsScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [treeStock, setTreeStock] = useState<TreeStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [actionSheetId, setActionSheetId] = useState<number | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingStock, setEditingStock] = useState<TreeStock | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load(opts?: { silent?: boolean }) {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      setTreeStock(await getTreeStock());
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
    if (isAtLimit(user?.maxFruitKinds, treeStock.length)) {
      router.push({ pathname: '/farm/upgrade', params: { resource: t('farm.fruits') } });
      return;
    }
    setEditingStock(null);
    setFormVisible(true);
  }

  function openEdit(id: number) {
    setActionSheetId(null);
    // A downgrade can leave more kinds than the plan allows; the server refuses edits until the
    // count is back within the cap, so send the user to the packets instead of the form.
    if (isOverLimit(user?.maxFruitKinds, treeStock.length)) {
      router.push({ pathname: '/farm/upgrade', params: { resource: t('farm.fruits'), over: '1' } });
      return;
    }
    const item = treeStock.find((i) => i.id === id);
    if (!item) return;
    setEditingStock(item);
    setFormVisible(true);
  }

  function handleDelete(id: number) {
    setActionSheetId(null);
    const item = treeStock.find((i) => i.id === id);
    if (!item) return;
    setConfirmDelete({ id, name: treeStockLabel(item, t) });
  }

  async function confirmDeleteItem() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteTreeStock(id);
      setTreeStock((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  function handleSaved(item: TreeStock, isNew: boolean) {
    setTreeStock((prev) => (isNew ? [...prev, item] : prev.map((i) => (i.id === item.id ? item : i))));
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
        <Text style={styles.headerTitle}>{t('farm.fruits')}</Text>
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
            <Text style={styles.errorText}>{t('treeStock.loadError')}</Text>
            <Pressable style={styles.retryButton} onPress={() => load()}>
              <Text style={styles.retryButtonLabel}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : treeStock.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('treeStock.empty')}</Text>
          </View>
        ) : (
          treeStock.map((item) => (
            <TreeStockCard
              key={item.id}
              item={item}
              onMenu={() => setActionSheetId(item.id)}
              onPress={() =>
                router.push({
                  pathname: '/farm/tree-stock-history/[treeStockId]',
                  params: { treeStockId: item.id, label: treeStockLabel(item, t) },
                })
              }
            />
          ))
        )}

        <Pressable style={styles.addButton} onPress={openAdd}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addButtonLabel}>{t('treeStock.add')}</Text>
        </Pressable>
      </ScrollView>

      <ActionSheet
        visible={actionSheetId != null}
        onEdit={() => actionSheetId != null && openEdit(actionSheetId)}
        onDelete={() => actionSheetId != null && handleDelete(actionSheetId)}
        onClose={() => setActionSheetId(null)}
      />

      <TreeStockFormModal
        visible={formVisible}
        editingStock={editingStock}
        existingItems={treeStock}
        onClose={() => setFormVisible(false)}
        onSaved={handleSaved}
      />

      <ConfirmDeleteModal
        visible={!!confirmDelete}
        name={confirmDelete?.name ?? ''}
        body={t('treeStock.deleteKept')}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteItem}
      />
    </SafeAreaView>
  );
}
