import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { styles } from '@/components/farm/shared/styles';
import { daysUntilExpected, isOverdue } from '@/components/harvest/harvest-analysis';
import { HARVEST_STATUS_BADGE_STYLE, HARVEST_STATUS_BADGE_TEXT_STYLE, HARVEST_STATUS_LABEL_KEY } from '@/components/harvest/status';
import { Brand } from '@/constants/theme';
import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import type { Harvest } from '@/types/harvest';

const HARVEST_ICON = require('@/assets/icons/harvest.png');

type Props = {
  item: Harvest;
  onMenu: () => void;
  onPress: () => void;
};

export function HarvestCard({ item, onMenu, onPress }: Props) {
  const { t, language } = useLanguage();

  const overdue = isOverdue(item);
  const daysLeft = daysUntilExpected(item);

  return (
    <View style={styles.livestockCard}>
      <Pressable
        style={styles.livestockCardBody}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={item.title}>
        <View style={styles.livestockIconWrap}>
          <Image source={HARVEST_ICON} style={styles.stockIcon} resizeMode="contain" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>{formatLocalizedIsoDate(item.date, language)}</Text>
          <View style={local.badgeRow}>
            <View style={[styles.statusBadge, HARVEST_STATUS_BADGE_STYLE[item.status]]}>
              <Text style={[styles.statusBadgeText, HARVEST_STATUS_BADGE_TEXT_STYLE[item.status]]}>
                {t(HARVEST_STATUS_LABEL_KEY[item.status])}
              </Text>
            </View>
            {overdue ? (
              <View style={local.overdueBadge}>
                <Text style={local.overdueBadgeText}>{t('harvest.overdueBy', { days: Math.abs(daysLeft ?? 0) })}</Text>
              </View>
            ) : item.status !== 'Harvested' && daysLeft != null ? (
              <View style={local.dueBadge}>
                <Text style={local.dueBadgeText}>{t('harvest.dueIn', { days: daysLeft })}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Pressable>
      <Pressable hitSlop={8} onPress={onMenu}>
        <Ionicons name="ellipsis-vertical" size={20} color={Brand.muted} />
      </Pressable>
    </View>
  );
}

const local = StyleSheet.create({
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  overdueBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  overdueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  dueBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: Brand.greenMuted,
  },
  dueBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.green,
  },
});
