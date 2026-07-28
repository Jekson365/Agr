import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { styles } from '@/components/farm/shared/styles';
import { HARVEST_STATUS_BADGE_STYLE, HARVEST_STATUS_BADGE_TEXT_STYLE, HARVEST_STATUS_LABEL_KEY } from '@/components/harvest/status';
import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { Brand } from '@/constants/theme';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import type { Harvest } from '@/types/harvest';

export type YieldRow = {
  key: string;
  label: string;
  icon: number;
  unitLabel: string;
  amount: number;
};

export function YieldRowsList({ rows }: { rows: YieldRow[] }) {
  return (
    <>
      {rows.map((row) => (
        <View key={row.key} style={local.yieldRow}>
          <Image source={row.icon} style={local.yieldIcon} resizeMode="contain" />
          <Text style={local.yieldLabel} numberOfLines={1}>
            {row.label}
          </Text>
          <Text style={local.yieldAmount}>
            {row.amount} {row.unitLabel}
          </Text>
        </View>
      ))}
    </>
  );
}

type Props = {
  harvest: Harvest;
  farmName: string | null;
  totalExpenses: number;
  yieldRows: YieldRow[];
  onPress: () => void;
};

export function HarvestReportCard({ harvest, farmName, totalExpenses, yieldRows, onPress }: Props) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const formattedDate = formatLocalizedIsoDate(harvest.date, language);

  return (
    <Pressable style={local.card} onPress={onPress} accessibilityRole="button" accessibilityLabel={harvest.title}>
      <View style={local.headerRow}>
        <Text style={local.title} numberOfLines={1}>
          {harvest.title}
        </Text>
        <View style={[styles.statusBadge, HARVEST_STATUS_BADGE_STYLE[harvest.status]]}>
          <Text style={[styles.statusBadgeText, HARVEST_STATUS_BADGE_TEXT_STYLE[harvest.status]]}>
            {t(HARVEST_STATUS_LABEL_KEY[harvest.status])}
          </Text>
        </View>
      </View>

      <Text style={styles.cardSubtitle}>{formattedDate}</Text>
      {farmName ? <Text style={styles.cardSubtitle}>{farmName}</Text> : null}
      {totalExpenses > 0 ? (
        <Text style={local.expensesText}>
          {t('report.expensesLabel')}: {formatPrice(totalExpenses)}
        </Text>
      ) : null}

      <Text style={local.sectionLabel}>{t('report.yieldLabel')}</Text>
      {yieldRows.length === 0 ? (
        <Text style={styles.emptyHint}>{t('report.noYieldForHarvest')}</Text>
      ) : (
        <YieldRowsList rows={yieldRows} />
      )}
    </Pressable>
  );
}

const local = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
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
    fontWeight: '600',
    color: Brand.dark,
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
  yieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  yieldIcon: {
    width: 20,
    height: 20,
  },
  yieldLabel: {
    flex: 1,
    fontSize: 13,
    color: Brand.dark,
  },
  yieldAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.dark,
  },
});
