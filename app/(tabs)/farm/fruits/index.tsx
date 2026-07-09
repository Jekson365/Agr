import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/farm/shared/action-sheet';
import { ConfirmDeleteModal } from '@/components/farm/shared/confirm-delete-modal';
import { styles } from '@/components/farm/shared/styles';
import { fruitTypeLabel } from '@/components/farm/tree-stock/tree-stock';
import { TreeStockCard } from '@/components/farm/tree-stock/tree-stock-card';
import { TreeStockFormModal } from '@/components/farm/tree-stock/tree-stock-form-modal';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { deleteTreeStock, getTreeStock } from '@/services/tree-stock-service';
import type { TreeStock } from '@/types/tree-stock';

export default function FruitsScreen() {
  const { t } = useLanguage();

  const [treeStock, setTreeStock] = useState<TreeStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionSheetId, setActionSheetId] = useState<number | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingStock, setEditingStock] = useState<TreeStock | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setTreeStock(await getTreeStock());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingStock(null);
    setFormVisible(true);
  }

  function openEdit(id: number) {
    setActionSheetId(null);
    const item = treeStock.find((i) => i.id === id);
    if (!item) return;
    setEditingStock(item);
    setFormVisible(true);
  }

  function handleDelete(id: number) {
    setActionSheetId(null);
    const item = treeStock.find((i) => i.id === id);
    if (!item) return;
    setConfirmDelete({ id, name: item.name.trim() || fruitTypeLabel(item.type, t) });
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={Brand.dark} />
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorText}>{t('treeStock.loadError')}</Text>
            <Pressable style={styles.retryButton} onPress={load}>
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
                  params: { treeStockId: item.id, label: item.name.trim() || fruitTypeLabel(item.type, t) },
                })
              }
            />
          ))
        )}

        <Pressable style={styles.addButton} onPress={openAdd}>
          <Ionicons name="add" size={18} color={Brand.dark} />
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
        onClose={() => setFormVisible(false)}
        onSaved={handleSaved}
      />

      <ConfirmDeleteModal
        visible={!!confirmDelete}
        name={confirmDelete?.name ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteItem}
      />
    </SafeAreaView>
  );
}
