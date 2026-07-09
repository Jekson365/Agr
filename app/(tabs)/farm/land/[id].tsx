import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDeleteModal } from '@/components/farm/shared/confirm-delete-modal';
import { LandPlotFormModal } from '@/components/farm/land/land-plot-form-modal';
import { cropImage, cropLabel } from '@/components/farm/land/crop';
import { styles } from '@/components/farm/shared/styles';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { getFarm } from '@/services/farm-service';
import { deleteLandPlot, getLandPlots } from '@/services/land-plot-service';
import type { Farm } from '@/types/farm';
import type { LandPlot } from '@/types/land-plot';

const LAND_IMAGE = require('@/assets/properties/land.png');

export default function LandDetailScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ id: string }>();
  const farmId = Number(params.id);

  const [farm, setFarm] = useState<Farm | null>(null);
  const [plots, setPlots] = useState<LandPlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formVisible, setFormVisible] = useState(false);
  const [editingPlot, setEditingPlot] = useState<LandPlot | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; crop: string } | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [item, list] = await Promise.all([getFarm(farmId), getLandPlots(farmId)]);
      setFarm(item);
      setPlots(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={Brand.dark} />
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorText}>{t('landPlot.loadError')}</Text>
            <Pressable style={styles.retryButton} onPress={load}>
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
                    <Text style={styles.detailCode}>{cropLabel(plot.crop, t)}</Text>
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
                      onPress={() => setConfirmDelete({ id: plot.id, crop: plot.crop })}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.delete')}>
                      <Ionicons name="trash-outline" size={20} color={Brand.muted} />
                    </Pressable>
                  </View>
                </View>
              ))
            )}

            <Pressable style={styles.addButton} onPress={openAdd}>
              <Ionicons name="add" size={18} color={Brand.dark} />
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
