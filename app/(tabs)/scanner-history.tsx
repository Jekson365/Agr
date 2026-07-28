import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDeleteModal } from '@/components/farm/shared/confirm-delete-modal';
import { styles as sharedStyles } from '@/components/farm/shared/styles';
import { PlantScanResultCard, SEVERITY_COLOR } from '@/components/scanner/plant-scan-result-card';
import { formatLocalizedIsoDate, type DateLanguage } from '@/components/ui/date-utils';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { deletePlantScanHistoryEntry, getPlantScanHistory } from '@/services/plant-scan-history-service';
import type { PlantScanHistoryEntry } from '@/types/plant-scan-history';

function formatDateTime(iso: string, language: DateLanguage): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${formatLocalizedIsoDate(iso, language)} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function ScannerHistoryScreen() {
  const { t, language } = useLanguage();

  const [entries, setEntries] = useState<PlantScanHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PlantScanHistoryEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PlantScanHistoryEntry | null>(null);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setEntries(await getPlantScanHistory());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deletePlantScanHistoryEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setSelected((prev) => (prev?.id === id ? null : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  return (
    <SafeAreaView style={sharedStyles.safeArea} edges={['top']}>
      <View style={sharedStyles.header}>
        <Pressable
          style={sharedStyles.headerSide}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={Brand.dark} />
        </Pressable>
        <Text style={sharedStyles.headerTitle}>{t('scanner.historyTitle')}</Text>
        <View style={sharedStyles.headerSide}>
          <LanguageToggle />
        </View>
      </View>

      <ScrollView contentContainerStyle={sharedStyles.scrollContent}>
        {loading ? (
          <View style={sharedStyles.stateBox}>
            <ActivityIndicator color={Brand.dark} />
          </View>
        ) : error ? (
          <View style={sharedStyles.stateBox}>
            <Text style={sharedStyles.errorText}>{error}</Text>
            <Pressable style={sharedStyles.retryButton} onPress={load}>
              <Text style={sharedStyles.retryButtonLabel}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : entries.length === 0 ? (
          <View style={sharedStyles.emptyState}>
            <Text style={sharedStyles.emptyStateText}>{t('scanner.historyEmpty')}</Text>
          </View>
        ) : (
          entries.map((entry) => (
            <Pressable key={entry.id} style={local.card} onPress={() => setSelected(entry)}>
              <Image source={{ uri: resolveAssetUrl(entry.imagePath) }} style={local.thumb} contentFit="cover" />
              <View style={local.cardInfo}>
                <Text style={local.cardTitle} numberOfLines={1}>
                  {entry.plantDetected ? entry.plantName || t('scanner.unknownPlant') : t('scanner.noPlantDetected')}
                </Text>
                <Text style={local.cardDate}>{formatDateTime(entry.createdAt, language)}</Text>
                {entry.plantDetected ? (
                  <View style={[local.severityBadge, { backgroundColor: SEVERITY_COLOR[entry.severity] ?? Brand.muted }]}>
                    <Text style={local.severityBadgeText}>
                      {entry.isHealthy ? t('scanner.healthy') : t(`scanner.severity${entry.severity}`)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Pressable
                hitSlop={8}
                onPress={() => setConfirmDelete(entry)}
                accessibilityRole="button"
                accessibilityLabel={t('common.delete')}>
                <Ionicons name="trash-outline" size={20} color={Brand.muted} />
              </Pressable>
            </Pressable>
          ))
        )}
      </ScrollView>

      <Modal visible={selected != null} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={local.detailOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelected(null)} />
          <View style={local.detailCard}>
            <ScrollView contentContainerStyle={local.detailScroll}>
              {selected ? (
                <>
                  <Image
                    source={{ uri: resolveAssetUrl(selected.imagePath) }}
                    style={local.detailImage}
                    contentFit="cover"
                  />
                  <Text style={local.detailDate}>{formatDateTime(selected.createdAt, language)}</Text>
                  <PlantScanResultCard result={selected} />
                </>
              ) : null}
            </ScrollView>
            <View style={sharedStyles.formActions}>
              <Pressable style={sharedStyles.formCancelButton} onPress={() => setSelected(null)}>
                <Text style={sharedStyles.formCancelLabel}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={sharedStyles.confirmDeleteButton}
                onPress={() => selected && setConfirmDelete(selected)}>
                <Text style={sharedStyles.formSubmitLabel}>{t('common.delete')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmDeleteModal
        visible={!!confirmDelete}
        name={confirmDelete?.plantName || t('scanner.unknownPlant')}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />
    </SafeAreaView>
  );
}

const local = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: Brand.greenMuted,
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.dark,
  },
  cardDate: {
    fontSize: 12,
    color: Brand.muted,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  severityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  detailCard: {
    backgroundColor: Brand.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  detailScroll: {
    paddingBottom: 8,
  },
  detailImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: Brand.greenMuted,
    marginBottom: 10,
  },
  detailDate: {
    fontSize: 12,
    color: Brand.muted,
    marginBottom: 10,
  },
});
