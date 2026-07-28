import { StyleSheet, Text, View } from 'react-native';

import { styles } from '@/components/farm/shared/styles';
import { YieldRowsList, type YieldRow } from '@/components/report/harvest-report-card';
import { Brand } from '@/constants/theme';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';

type Props = {
  harvestsCount: number;
  totalExpenses: number;
  yieldRows: YieldRow[];
};

/** The first item of the report list: a grand total across every currently filtered harvest,
 * styled like a HarvestReportCard so it reads as part of the same list rather than a separate
 * section. */
export function TotalReportCard({ harvestsCount, totalExpenses, yieldRows }: Props) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  return (
    <View style={local.card}>
      <View style={local.headerRow}>
        <Text style={local.title}>Σ {t('report.totalLabel')}</Text>
        <View style={[styles.statusBadge, local.countBadge]}>
          <Text style={[styles.statusBadgeText, local.countBadgeText]}>
            {t('report.harvestsCountBadge', { count: harvestsCount })}
          </Text>
        </View>
      </View>

      {totalExpenses > 0 ? (
        <Text style={local.expensesText}>
          {t('report.expensesLabel')}: {formatPrice(totalExpenses)}
        </Text>
      ) : null}

      <Text style={local.sectionLabel}>{t('report.yieldLabel')}</Text>
      {yieldRows.length === 0 ? (
        <Text style={styles.emptyHint}>{t('report.noYieldData')}</Text>
      ) : (
        <YieldRowsList rows={yieldRows} />
      )}
    </View>
  );
}

const local = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Brand.green,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    backgroundColor: Brand.greenMuted,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: Brand.dark,
  },
  countBadge: {
    backgroundColor: Brand.green,
    borderColor: Brand.green,
  },
  countBadgeText: {
    color: '#FFFFFF',
  },
  expensesText: {
    fontSize: 13,
    color: Brand.dark,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.muted,
    marginTop: 10,
    marginBottom: 6,
  },
});
