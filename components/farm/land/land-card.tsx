import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { styles } from '@/components/farm/shared/styles';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import type { Farm } from '@/types/farm';

const LAND_IMAGE = require('@/assets/properties/land.png');

type Props = {
  item: Farm;
  onMenu: () => void;
  onPress?: () => void;
};

export function LandCard({ item, onMenu, onPress }: Props) {
  const { t } = useLanguage();

  return (
    <View style={styles.landCard}>
      <View style={styles.landCardHeader}>
        <Pressable style={styles.cardInfo} onPress={onPress} accessibilityRole="button" accessibilityLabel={item.name}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>{t('farm.area')} {item.area} {t('farm.areaUnit')}</Text>
          <Text style={styles.cardSubtitle}>{t('farm.location')}: {item.location}</Text>
        </Pressable>
        <Pressable hitSlop={8} onPress={onMenu}>
          <Ionicons name="ellipsis-vertical" size={20} color={Brand.muted} />
        </Pressable>
      </View>
      <Pressable onPress={onPress}>
        <Image
          source={item.imagePath ? { uri: resolveAssetUrl(item.imagePath) } : LAND_IMAGE}
          style={styles.landIllustration}
          contentFit="cover"
        />
      </Pressable>
    </View>
  );
}
