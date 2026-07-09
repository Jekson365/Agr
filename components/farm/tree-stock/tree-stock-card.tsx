import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, Text, View } from 'react-native';

import { styles } from '@/components/farm/shared/styles';
import { fruitKindImage, fruitTypeLabel, TREE_STOCK_UNIT_LABEL_KEY } from '@/components/farm/tree-stock/tree-stock';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import type { TreeStock } from '@/types/tree-stock';

type Props = {
  item: TreeStock;
  onMenu: () => void;
  onPress?: () => void;
};

export function TreeStockCard({ item, onMenu, onPress }: Props) {
  const { t } = useLanguage();
  const typeLabel = fruitTypeLabel(item.type, t);
  const unitLabel = t(TREE_STOCK_UNIT_LABEL_KEY[item.unit]);
  const title = item.name.trim() || typeLabel;

  return (
    <View style={styles.livestockCard}>
      <Pressable
        style={styles.livestockCardBody}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}>
        <View style={styles.livestockIconWrap}>
          <Image source={fruitKindImage(item.type)} style={styles.stockIcon} resizeMode="contain" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>
            {item.name.trim() ? `${typeLabel} · ` : ''}
            {item.amount} {unitLabel}
          </Text>
        </View>
      </Pressable>
      <Pressable hitSlop={8} onPress={onMenu}>
        <Ionicons name="ellipsis-vertical" size={20} color={Brand.muted} />
      </Pressable>
    </View>
  );
}
