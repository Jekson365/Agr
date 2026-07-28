import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatAge } from '@/components/farm/livestock/age';
import { ConfirmDeleteModal } from '@/components/farm/shared/confirm-delete-modal';
import { LIVESTOCK_KIND_IMAGE } from '@/components/farm/livestock/livestock';
import { LivestockDetailFormModal } from '@/components/farm/livestock/livestock-detail-form-modal';
import { styles } from '@/components/farm/shared/styles';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { deleteLivestockDetail, getLivestockDetails } from '@/services/livestock-detail-service';
import { getLivestockItem } from '@/services/livestock-service';
import type { Livestock } from '@/types/livestock';
import type { LivestockDetail } from '@/types/livestock-detail';

export default function LivestockDetailScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ id: string }>();
  const livestockId = Number(params.id);

  const [livestock, setLivestock] = useState<Livestock | null>(null);
  const [details, setDetails] = useState<LivestockDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [formVisible, setFormVisible] = useState(false);
  const [editingDetail, setEditingDetail] = useState<LivestockDetail | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; code: string } | null>(null);

  function openHistory(detail: LivestockDetail) {
    router.push({
      pathname: '/farm/history/[stockId]',
      params: { stockId: detail.id, livestockId, label: detail.code, image: detail.imagePath },
    });
  }

  function openProduction(detail: LivestockDetail) {
    router.push({
      pathname: '/farm/production/[animalId]',
      params: { animalId: detail.id, label: detail.code },
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livestockId]);

  async function load(opts?: { silent?: boolean }) {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const [item, list] = await Promise.all([getLivestockItem(livestockId), getLivestockDetails(livestockId)]);
      setLivestock(item);
      setDetails(list);
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
    setEditingDetail(null);
    setFormVisible(true);
  }

  function openEdit(detail: LivestockDetail) {
    setEditingDetail(detail);
    setFormVisible(true);
  }

  function handleSaved(detail: LivestockDetail, isNew: boolean) {
    setDetails((prev) => (isNew ? [...prev, detail] : prev.map((d) => (d.id === detail.id ? detail : d))));
  }

  async function confirmDeleteDetail() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteLivestockDetail(id);
      setDetails((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
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
        <Text style={styles.headerTitle}>{livestock?.name ?? t('farm.livestock')}</Text>
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
            <Text style={styles.errorText}>{t('livestockDetail.loadError')}</Text>
            <Pressable style={styles.retryButton} onPress={() => load()}>
              <Text style={styles.retryButtonLabel}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {details.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>{t('livestockDetail.empty')}</Text>
              </View>
            ) : (
              details.map((detail) => (
                <View key={detail.id} style={styles.detailCard}>
                  <Pressable
                    style={styles.livestockCardBody}
                    onPress={() => openHistory(detail)}
                    accessibilityRole="button"
                    accessibilityLabel={t('history.title')}>
                    {detail.imagePath ? (
                      <Image
                        source={{ uri: resolveAssetUrl(detail.imagePath) }}
                        style={styles.detailImage}
                        contentFit="cover"
                      />
                    ) : livestock ? (
                      <View style={styles.detailImagePlaceholder}>
                        <Image
                          source={LIVESTOCK_KIND_IMAGE[livestock.type]}
                          style={styles.livestockIcon}
                          contentFit="contain"
                        />
                      </View>
                    ) : (
                      <View style={styles.detailImagePlaceholder}>
                        <Ionicons name="image-outline" size={24} color={Brand.muted} />
                      </View>
                    )}
                    <View style={styles.detailInfo}>
                      <Text style={styles.detailCode}>{detail.code}</Text>
                      {formatAge(detail.bornDate, t) ? (
                        <Text style={styles.detailAge}>
                          {t("farm.age")}: {formatAge(detail.bornDate, t)}
                        </Text>
                      ) : null}
                      {detail.gender ? (
                        <Text style={styles.detailAge}>
                          {t(detail.gender === 'Male' ? 'livestockDetail.male' : 'livestockDetail.female')}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                  <View style={styles.detailActions}>
                    {/* <Pressable
                      hitSlop={8}
                      onPress={() => openProduction(detail)}
                      accessibilityRole="button"
                      accessibilityLabel={t('production.title')}>
                      <Ionicons name="basket-outline" size={20} color={Brand.muted} />
                    </Pressable> */}
                    <Pressable
                      hitSlop={8}
                      onPress={() => openEdit(detail)}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.edit')}>
                      <Ionicons name="pencil-outline" size={20} color={Brand.muted} />
                    </Pressable>
                    <Pressable
                      hitSlop={8}
                      onPress={() => setConfirmDelete({ id: detail.id, code: detail.code })}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.delete')}>
                      <Ionicons name="trash-outline" size={20} color={Brand.muted} />
                    </Pressable>
                  </View>
                </View>
              ))
            )}

            <Pressable style={styles.addButton} onPress={openAdd}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addButtonLabel}>{t('livestockDetail.add')}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <LivestockDetailFormModal
        visible={formVisible}
        livestockId={livestockId}
        editingDetail={editingDetail}
        onClose={() => setFormVisible(false)}
        onSaved={handleSaved}
      />

      <ConfirmDeleteModal
        visible={!!confirmDelete}
        name={confirmDelete?.code ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteDetail}
      />
    </SafeAreaView>
  );
}
