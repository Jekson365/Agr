import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '@/components/farm/shared/styles';
import { STOCK_UNIT_LABEL_KEY } from '@/components/farm/stock/stock';
import { StockPhotoHistoryView } from '@/components/farm/stock/stock-photo-history';
import { formatLocalizedIsoDate, type DateLanguage } from '@/components/ui/date-utils';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { getStockMovements } from '@/services/stock-movement-service';
import { getStockItem } from '@/services/stock-service';
import type { Stock } from '@/types/stock';
import type { StockMovement, StockMovementSource } from '@/types/stock-movement';

const SOURCE_LABEL_KEY: Record<StockMovementSource, string> = {
  Manual: 'stockHistory.sourceManual',
  Harvest: 'stockHistory.sourceHarvest',
};

type Tab = 'movements' | 'photos';

export default function StockHistoryScreen() {
  const { t, language } = useLanguage();
  const params = useLocalSearchParams<{ stockId: string; label?: string }>();
  const stockId = Number(params.stockId);

  const [tab, setTab] = useState<Tab>('movements');
  const [stock, setStock] = useState<Stock | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [photosRefreshKey, setPhotosRefreshKey] = useState(0);

  useEffect(() => {
    if (!stockId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockId]);

  async function load(opts?: { silent?: boolean }) {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      const [item, list] = await Promise.all([getStockItem(stockId), getStockMovements(stockId)]);
      setStock(item);
      setMovements(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (!opts?.silent) setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    if (tab === 'photos') {
      // StockPhotoHistoryView fetches its own data; remount it to refresh.
      setPhotosRefreshKey((key) => key + 1);
      setTimeout(() => setRefreshing(false), 400);
    } else {
      load({ silent: true });
    }
  }

  // Records come back ordered oldest→newest; show the most recent movement first.
  const newestFirst = [...movements].reverse();
  const unitLabel = stock ? t(STOCK_UNIT_LABEL_KEY[stock.unit]) : '';

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
        <Text style={styles.headerTitle}>{params.label || t('stockHistory.title')}</Text>
        <View style={styles.headerSide}>
          <LanguageToggle />
        </View>
      </View>

      <View style={styles.tabRow}>
        <Pressable style={styles.tabItem} onPress={() => setTab('movements')}>
          <Text style={[styles.tabLabel, tab === 'movements' && styles.tabLabelActive]}>
            {t('stockHistory.movementsTab')}
          </Text>
          {tab === 'movements' && <View style={styles.tabIndicator} />}
        </Pressable>
        <Pressable style={styles.tabItem} onPress={() => setTab('photos')}>
          <Text style={[styles.tabLabel, tab === 'photos' && styles.tabLabelActive]}>
            {t('stockHistory.photosTab')}
          </Text>
          {tab === 'photos' && <View style={styles.tabIndicator} />}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.dark} />}>
        {tab === 'movements' ? (
          loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={Brand.dark} />
            </View>
          ) : error ? (
            <View style={styles.stateBox}>
              <Text style={styles.errorText}>{t('stockHistory.loadError')}</Text>
              <Pressable style={styles.retryButton} onPress={() => load()}>
                <Text style={styles.retryButtonLabel}>{t('common.retry')}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {stock ? (
                <View style={styles.historySummary}>
                  <View>
                    <Text style={styles.historyStatLabel}>{t('stockHistory.current')}</Text>
                    <Text style={styles.historyStatValue}>
                      {stock.amount} {unitLabel}
                    </Text>
                  </View>
                </View>
              ) : null}

              {movements.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>{t('stockHistory.empty')}</Text>
                </View>
              ) : (
                newestFirst.map((movement) => (
                  <View
                    key={movement.id}
                    style={[styles.historyRow, movement.delta < 0 ? styles.historyRowDown : styles.historyRowUp]}>
                    <View>
                      <Text style={styles.historyRowDate}>{formatDateTime(movement.createdAt, language)}</Text>
                      <Text style={styles.historyRowDate}>{t(SOURCE_LABEL_KEY[movement.source])}</Text>
                    </View>
                    <Text
                      style={[
                        styles.historyRowWeight,
                        movement.delta < 0 ? styles.historyRowWeightDown : styles.historyRowWeightUp,
                      ]}>
                      {movement.delta >= 0 ? '+' : ''}
                      {movement.delta} {unitLabel}
                    </Text>
                  </View>
                ))
              )}
            </>
          )
        ) : (
          <StockPhotoHistoryView key={photosRefreshKey} stockId={stockId} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDateTime(iso: string, language: DateLanguage): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${formatLocalizedIsoDate(iso, language)} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
