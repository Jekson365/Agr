import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, Text, View } from 'react-native';

import { styles } from '@/components/farm/shared/styles';
import { HARVEST_STATUS_BADGE_STYLE, HARVEST_STATUS_BADGE_TEXT_STYLE, HARVEST_STATUS_LABEL_KEY } from '@/components/harvest/status';
import { Brand } from '@/constants/theme';
import { parseIsoDate } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import type { Harvest } from '@/types/harvest';

const HARVEST_ICON = require('@/assets/icons/harvest.png');

type Props = {
  item: Harvest;
  onMenu: () => void;
  onPress: () => void;
};

export function HarvestCard({ item, onMenu, onPress }: Props) {
  const { t } = useLanguage();

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
          <Text style={styles.cardSubtitle}>{parseIsoDate(item.date)?.toLocaleDateString() ?? item.date}</Text>
          <View style={[styles.statusBadge, HARVEST_STATUS_BADGE_STYLE[item.status]]}>
            <Text style={[styles.statusBadgeText, HARVEST_STATUS_BADGE_TEXT_STYLE[item.status]]}>
              {t(HARVEST_STATUS_LABEL_KEY[item.status])}
            </Text>
          </View>
        </View>
      </Pressable>
      <Pressable hitSlop={8} onPress={onMenu}>
        <Ionicons name="ellipsis-vertical" size={20} color={Brand.muted} />
      </Pressable>
    </View>
  );
}
