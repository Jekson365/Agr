import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { LIVESTOCK_KIND_IMAGE } from '@/components/farm/livestock/livestock';
import { styles } from '@/components/farm/shared/styles';
import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { Brand } from '@/constants/theme';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import type { AnimalType } from '@/types/livestock';

export type ProductionTotalRow = {
  key: string;
  label: string;
  unitLabel: string;
  amount: number;
};

export function ProductionTotalRowsList({ rows }: { rows: ProductionTotalRow[] }) {
  return (
    <>
      {rows.map((row) => (
        <View key={row.key} style={local.totalRow}>
          <Text style={local.totalRowLabel} numberOfLines={1}>
            {row.label}
          </Text>
          <Text style={local.totalRowAmount}>
            {row.amount} {row.unitLabel}
          </Text>
        </View>
      ))}
    </>
  );
}

type TotalProps = {
  recordsCount: number;
  totalValue: number;
  rows: ProductionTotalRow[];
};

/** The first item of the production list: a grand total across every currently filtered record,
 * styled to match TotalReportCard so both report tabs read as the same design. */
export function ProductionTotalCard({ recordsCount, totalValue, rows }: TotalProps) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  return (
    <View style={local.totalCard}>
      <View style={local.headerRow}>
        <Text style={local.title}>Σ {t('report.totalLabel')}</Text>
        <View style={[styles.statusBadge, local.countBadge]}>
          <Text style={[styles.statusBadgeText, local.countBadgeText]}>
            {t('report.recordsCountBadge', { count: recordsCount })}
          </Text>
        </View>
      </View>

      {totalValue > 0 ? (
        <Text style={local.valueText}>
          {t('report.valueLabel')}: {formatPrice(totalValue)}
        </Text>
      ) : null}

      <Text style={local.sectionLabel}>{t('report.yieldLabel')}</Text>
      {rows.length === 0 ? (
        <Text style={styles.emptyHint}>{t('report.noProductionData')}</Text>
      ) : (
        <ProductionTotalRowsList rows={rows} />
      )}
    </View>
  );
}

type RecordProps = {
  animalType: AnimalType | null;
  productLabel: string;
  targetLabel: string;
  farmName: string | null;
  collectionDate: string;
  quantity: number;
  unitLabel: string;
  unitShortName: string;
  totalPrice: number | null;
  onPress?: () => void;
};

export function ProductionRecordCard({
  animalType,
  productLabel,
  targetLabel,
  farmName,
  collectionDate,
  quantity,
  unitLabel,
  unitShortName,
  totalPrice,
  onPress,
}: RecordProps) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const formattedDate = formatLocalizedIsoDate(collectionDate, language);

  return (
    <Pressable style={local.card} onPress={onPress} disabled={!onPress}>
      <View style={local.headerRow}>
        <View style={local.titleRow}>
          {animalType ? (
            <Image source={LIVESTOCK_KIND_IMAGE[animalType]} style={local.icon} resizeMode="contain" />
          ) : null}
          <Text style={local.title} numberOfLines={1}>
            {targetLabel}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{productLabel}</Text>
        </View>
      </View>

      <Text style={styles.cardSubtitle}>{formattedDate}</Text>
      {farmName ? <Text style={styles.cardSubtitle}>{farmName}</Text> : null}

      <Text style={local.quantityText}>
        {quantity} {unitShortName} ({unitLabel})
      </Text>
      {totalPrice != null ? (
        <Text style={local.valueText}>
          {t('report.valueLabel')}: {formatPrice(totalPrice)}
        </Text>
      ) : null}
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
  totalCard: {
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
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 20,
    height: 20,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Brand.dark,
  },
  countBadge: {
    backgroundColor: Brand.green,
    borderColor: Brand.green,
  },
  countBadgeText: {
    color: '#FFFFFF',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.dark,
    marginTop: 8,
  },
  valueText: {
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
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalRowLabel: {
    flex: 1,
    fontSize: 13,
    color: Brand.dark,
  },
  totalRowAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.dark,
  },
});
