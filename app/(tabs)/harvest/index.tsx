import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/farm/shared/action-sheet';
import { ConfirmDeleteModal } from '@/components/farm/shared/confirm-delete-modal';
import { styles } from '@/components/farm/shared/styles';
import { HarvestCard } from '@/components/harvest/harvest-card';
import { HarvestFormModal } from '@/components/harvest/harvest-form-modal';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { deleteHarvest, getHarvests } from '@/services/harvest-service';
import type { Harvest } from '@/types/harvest';

export default function HarvestScreen() {
  const { t } = useLanguage();

  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionSheetId, setActionSheetId] = useState<number | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState<Harvest | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; title: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setHarvests(await getHarvests());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={Brand.dark} />
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorText}>{t('harvest.loadError')}</Text>
            <Pressable style={styles.retryButton} onPress={load}>
              <Text style={styles.retryButtonLabel}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : harvests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('harvest.empty')}</Text>
          </View>
        ) : (
          harvests.map((item) => (
            <HarvestCard
              key={item.id}
              item={item}
              onMenu={() => setActionSheetId(item.id)}
              onPress={() => router.push({ pathname: '/harvest/detail/[id]', params: { id: item.id } })}
            />
          ))
        )}

        <Pressable style={styles.addButton} onPress={openAdd}>
          <Ionicons name="add" size={18} color={Brand.dark} />
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
