import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, Text, View } from 'react-native';

import { stockKindImage, stockTypeLabel } from '@/components/farm/stock/stock';
import { styles } from '@/components/farm/shared/styles';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import type { Stock } from '@/types/stock';

type Props = {
  item: Stock;
  onMenu: () => void;
  onPress?: () => void;
};

export function StockCard({ item, onMenu, onPress }: Props) {
  const { t } = useLanguage();
  const typeLabel = stockTypeLabel(item.type, t);
  const title = item.name.trim() || typeLabel;
  return (
    <View style={styles.livestockCard}>
      <Pressable
        style={styles.livestockCardBody}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}>
        <View style={styles.livestockIconWrap}>
          <Image source={stockKindImage(item.type)} style={styles.stockIcon} resizeMode="contain" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{title}</Text>
          {item.name.trim() ? <Text style={styles.cardSubtitle}>{typeLabel}</Text> : null}
        </View>
      </Pressable>
      <Pressable hitSlop={8} onPress={onMenu}>
        <Ionicons name="ellipsis-vertical" size={20} color={Brand.muted} />
      </Pressable>
    </View>
  );
}
