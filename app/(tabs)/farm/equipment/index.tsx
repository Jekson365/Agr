import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EquipmentCard } from '@/components/farm/equipment/equipment-card';
import { EquipmentFormModal } from '@/components/farm/equipment/equipment-form-modal';
import { ConfirmDeleteModal } from '@/components/farm/shared/confirm-delete-modal';
import { styles } from '@/components/farm/shared/styles';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { deleteEquipment, getEquipment } from '@/services/equipment-service';
import type { Equipment } from '@/types/equipment';

export default function EquipmentScreen() {
  const { t } = useLanguage();

  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [formVisible, setFormVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Equipment | null>(null);
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
      setEquipment(await getEquipment());
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
    setEditingItem(null);
    setFormVisible(true);
  }

  function openEdit(id: number) {
    const item = equipment.find((i) => i.id === id);
    if (!item) return;
    setEditingItem(item);
    setFormVisible(true);
  }

  function handleDelete(item: Equipment) {
    setFormVisible(false);
    setConfirmDelete({ id: item.id, name: item.name });
  }

  async function confirmDeleteItem() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteEquipment(id);
      setEquipment((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  function handleSaved(item: Equipment, isNew: boolean) {
    setEquipment((prev) => (isNew ? [...prev, item] : prev.map((i) => (i.id === item.id ? item : i))));
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
        <Text style={styles.headerTitle}>{t('equipment.title')}</Text>
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
            <Text style={styles.errorText}>{t('equipment.loadError')}</Text>
            <Pressable style={styles.retryButton} onPress={() => load()}>
              <Text style={styles.retryButtonLabel}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : equipment.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{t('equipment.empty')}</Text>
          </View>
        ) : (
          <View style={styles.productGrid}>
            {equipment.map((item) => (
              <EquipmentCard key={item.id} item={item} onPress={() => openEdit(item.id)} />
            ))}
          </View>
        )}

        <Pressable style={styles.addButton} onPress={openAdd}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addButtonLabel}>{t('equipment.add')}</Text>
        </Pressable>
      </ScrollView>

      <EquipmentFormModal
        visible={formVisible}
        editingItem={editingItem}
        onClose={() => setFormVisible(false)}
        onSaved={handleSaved}
        onDelete={handleDelete}
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
