import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '@/components/farm/shared/styles';
import { STOCK_UNIT_LABEL_KEY, stockTypeLabel } from '@/components/farm/stock/stock';
import { fruitTypeLabel, TREE_STOCK_UNIT_LABEL_KEY } from '@/components/farm/tree-stock/tree-stock';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { getStockMovementReport } from '@/services/report-service';
import type { StockMovementReportRow } from '@/types/report';

type ProductBalance = {
  key: string;
  title: string;
  unitLabel: string;
  balance: number;
};

// The API returns every movement grouped by product (Stock or TreeStock id); summing each
// product's deltas here gives its current balance without a separate call to fetch stock
// directly. A row's key differentiates Stock from TreeStock since their ids come from separate
// sequences and can collide numerically.
function balancesByProduct(rows: StockMovementReportRow[], t: (key: string) => string): ProductBalance[] {
  const balances: ProductBalance[] = [];
  const byKey = new Map<string, ProductBalance>();

  for (const row of rows) {
    // A good taken off the stock list isn't part of what the farm holds any more, however its
    // movements still read in a report of the period they happened in.
    if (row.isDeleted) continue;

    const isTree = row.stockId == null;
    const key = isTree ? `tree:${row.treeStockId}` : `stock:${row.stockId}`;
    let balance = byKey.get(key);
    if (!balance) {
      balance = {
        key,
        title: row.name.trim() || (isTree ? fruitTypeLabel(row.type, t) : stockTypeLabel(row.type, t)),
        unitLabel: isTree
          ? t(TREE_STOCK_UNIT_LABEL_KEY[row.unit] ?? row.unit)
          : t(STOCK_UNIT_LABEL_KEY[row.unit] ?? row.unit),
        balance: 0,
      };
      byKey.set(key, balance);
      balances.push(balance);
    }
    balance.balance += row.delta;
  }

  return balances;
}

export default function BalanceScreen() {
  const { t } = useLanguage();

  const [rows, setRows] = useState<StockMovementReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load(opts?: { silent?: boolean }) {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      setRows(await getStockMovementReport());
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

  const balances = balancesByProduct(rows, t);

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
        <Text style={styles.headerTitle}>{t('farm.balance')}</Text>
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
            <Text style={styles.errorText}>{t('balance.loadError')}</Text>
            <Pressable style={styles.retryButton} onPress={() => load()}>
              <Text style={styles.retryButtonLabel}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={report.section}>
            <Text style={report.sectionTitle}>{t('balance.title')}</Text>

            <View style={report.table}>
              <View style={[report.row, report.headerRow]}>
                <Text style={[report.headerCell, report.col]}>{t('balance.colPlant')}</Text>
                <Text style={[report.headerCell, report.col, report.alignRight]}>
                  {t('balance.colBalance')}
                </Text>
              </View>

              {balances.length === 0 ? (
                <View style={report.emptyRow}>
                  <Text style={styles.cardSubtitle}>{t('balance.empty')}</Text>
                </View>
              ) : (
                balances.map((item, index) => {
                  const isLast = index === balances.length - 1;
                  return (
                    <View key={item.key} style={[report.row, isLast && report.rowLast]}>
                      <Text style={[report.plantName, report.col]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={[report.balanceText, report.col, report.alignRight]}>
                        {item.balance} {item.unitLabel}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const report = StyleSheet.create({
  section: {
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.dark,
    marginBottom: 12,
  },
  table: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Brand.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  headerRow: {
    backgroundColor: Brand.greenMuted,
  },
  col: {
    flex: 1,
    paddingHorizontal: 4,
  },
  alignRight: {
    alignItems: 'flex-end',
    textAlign: 'right',
  },
  headerCell: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.muted,
    textTransform: 'uppercase',
  },
  plantName: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.dark,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.dark,
    textAlign: 'right',
  },
  emptyRow: {
    paddingHorizontal: 14,
    paddingVertical: 20,
    alignItems: 'center',
  },
});
