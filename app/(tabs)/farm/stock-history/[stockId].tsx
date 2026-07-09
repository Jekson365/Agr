import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { STOCK_UNIT_LABEL_KEY } from '@/components/farm/stock/stock';
import { styles } from '@/components/farm/shared/styles';
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

export default function StockHistoryScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ stockId: string; label?: string }>();
  const stockId = Number(params.stockId);

  const [stock, setStock] = useState<Stock | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stockId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [item, list] = await Promise.all([getStockItem(stockId), getStockMovements(stockId)]);
      setStock(item);
      setMovements(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={Brand.dark} />
          </View>
        ) : error ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorText}>{t('stockHistory.loadError')}</Text>
            <Pressable style={styles.retryButton} onPress={load}>
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
                    <Text style={styles.historyRowDate}>{formatDateTime(movement.createdAt)}</Text>
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
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
