import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDeleteModal } from '@/components/farm/shared/confirm-delete-modal';
import { LandPlotFormModal } from '@/components/farm/land/land-plot-form-modal';
import { cropImage, cropLabel } from '@/components/farm/land/crop';
import { styles } from '@/components/farm/shared/styles';
import { treeStockLabel } from '@/components/farm/tree-stock/tree-stock';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { getFarm } from '@/services/farm-service';
import { deleteLandPlot, getLandPlots } from '@/services/land-plot-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { Farm } from '@/types/farm';
import type { LandPlot } from '@/types/land-plot';
import type { TreeStock } from '@/types/tree-stock';

const LAND_IMAGE = require('@/assets/properties/land.png');

export default function LandDetailScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ id: string }>();
  const farmId = Number(params.id);

  const [farm, setFarm] = useState<Farm | null>(null);
  const [plots, setPlots] = useState<LandPlot[]>([]);
  /** The farm's fruit entries, so each plot can be named after the one it grows. */
  const [fruits, setFruits] = useState<TreeStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [formVisible, setFormVisible] = useState(false);
  const [editingPlot, setEditingPlot] = useState<LandPlot | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; crop: string } | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

  async function load(opts?: { silent?: boolean }) {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const [item, list, stock] = await Promise.all([getFarm(farmId), getLandPlots(farmId), getTreeStock()]);
      setFarm(item);
      setPlots(list);
      setFruits(stock);
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
    setEditingPlot(null);
    setFormVisible(true);
  }

  function openEdit(plot: LandPlot) {
    setEditingPlot(plot);
    setFormVisible(true);
  }

  function handleSaved(plot: LandPlot, isNew: boolean) {
    setPlots((prev) => (isNew ? [...prev, plot] : prev.map((p) => (p.id === plot.id ? plot : p))));
    // The form offers fruits added since this screen loaded, which aren't in the list yet — fetch
    // them so the plot shows the name of the one it grows rather than falling back to its kind.
    if (plot.treeStockId != null && !fruits.some((fruit) => fruit.id === plot.treeStockId)) {
      getTreeStock().then(setFruits).catch(() => {});
    }
  }

  /** A plot goes by the fruit entry planted on it — two plots of apples are "Gala" and "Fuji", not
   *  "Apple" twice. Plots from before they named an entry fall back to the crop they recorded. */
  function plotLabel(plot: LandPlot): string {
    const fruit = fruits.find((item) => item.id === plot.treeStockId);
    return fruit ? treeStockLabel(fruit, t) : cropLabel(plot.crop, t);
  }

  async function confirmDeletePlot() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteLandPlot(id);
      setPlots((prev) => prev.filter((p) => p.id !== id));
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
        <Text style={styles.headerTitle}>{farm?.name ?? t('farm.land')}</Text>
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
            <Text style={styles.errorText}>{t('landPlot.loadError')}</Text>
            <Pressable style={styles.retryButton} onPress={() => load()}>
              <Text style={styles.retryButtonLabel}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {farm ? (
              <Image
                source={farm.imagePath ? { uri: resolveAssetUrl(farm.imagePath) } : LAND_IMAGE}
                style={styles.historyHeroImage}
                contentFit="cover"
              />
            ) : null}

            {farm ? (
              <View style={styles.landDetailsBlock}>
                <Text style={styles.cardSubtitle}>
                  {t('farm.area')} {farm.area} {t('farm.areaUnit')}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {t('farm.location')}: {farm.location}
                </Text>
              </View>
            ) : null}

            {plots.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>{t('landPlot.empty')}</Text>
              </View>
            ) : (
              plots.map((plot) => (
                <View key={plot.id} style={styles.detailCard}>
                  <View style={styles.detailImagePlaceholder}>
                    <Image
                      source={cropImage(plot.crop)}
                      style={styles.livestockIcon}
                      contentFit="contain"
                    />
                  </View>
                  <View style={styles.detailInfo}>
                    <Text style={styles.detailCode}>{plotLabel(plot)}</Text>
                    <Text style={styles.detailAge}>
                      {plot.area} {t('farm.areaUnit')}
                    </Text>
                  </View>
                  <View style={styles.detailActions}>
                    <Pressable
                      hitSlop={8}
                      onPress={() => openEdit(plot)}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.edit')}>
                      <Ionicons name="pencil-outline" size={20} color={Brand.muted} />
                    </Pressable>
                    <Pressable
                      hitSlop={8}
                      onPress={() => setConfirmDelete({ id: plot.id, crop: plotLabel(plot) })}
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
              <Text style={styles.addButtonLabel}>{t('landPlot.add')}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <LandPlotFormModal
        visible={formVisible}
        farmId={farmId}
        editingPlot={editingPlot}
        onClose={() => setFormVisible(false)}
        onSaved={handleSaved}
      />

      <ConfirmDeleteModal
        visible={!!confirmDelete}
        name={confirmDelete?.crop ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeletePlot}
      />
    </SafeAreaView>
  );
}
