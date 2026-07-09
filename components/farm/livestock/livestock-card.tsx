import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, Text, View } from 'react-native';

import { LIVESTOCK_KIND_IMAGE } from '@/components/farm/livestock/livestock';
import { styles } from '@/components/farm/shared/styles';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import type { Livestock } from '@/types/livestock';

type Props = {
  item: Livestock;
  farmName?: string;
  onMenu: () => void;
  onProduction: () => void;
  onPress?: () => void;
};

export function LivestockCard({ item, farmName, onMenu, onProduction, onPress }: Props) {
  const {t} = useLanguage();
  return (
    <View style={styles.livestockCard}>
      <Pressable
        style={styles.livestockCardBody}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={item.name}>
        <View style={styles.livestockIconWrap}>
          <Image source={LIVESTOCK_KIND_IMAGE[item.type]} style={styles.livestockIcon} resizeMode="contain" />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>{t('farm.count')}: {item.count}</Text>
          {farmName ? <Text style={styles.cardSubtitle}>{t('farm.farm')}: {farmName}</Text> : null}
        </View>
      </Pressable>
      <View style={styles.detailActions}>
        <Pressable
          hitSlop={8}
          onPress={onProduction}
          accessibilityRole="button"
          accessibilityLabel={t('production.title')}>
          <Ionicons name="basket-outline" size={20} color={Brand.muted} />
        </Pressable>
        <Pressable hitSlop={8} onPress={onMenu}>
          <Ionicons name="ellipsis-vertical" size={20} color={Brand.muted} />
        </Pressable>
      </View>
    </View>
  );
}
