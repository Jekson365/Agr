import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { styles } from '@/components/farm/shared/styles';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import type { Equipment } from '@/types/equipment';

const EQUIPMENT_IMAGE = require('@/assets/properties/equipment.png');

type Props = {
  item: Equipment;
  onPress?: () => void;
};

export function EquipmentCard({ item, onPress }: Props) {
  const { t } = useLanguage();

  return (
    <Pressable style={styles.productCard} onPress={onPress} accessibilityRole="button" accessibilityLabel={item.name}>
      <Image
        source={item.imagePath ? { uri: resolveAssetUrl(item.imagePath) } : EQUIPMENT_IMAGE}
        style={styles.productImage}
        contentFit="cover"
      />
      <View style={styles.productInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.cardSubtitle}>
          {t('equipment.quantity')}: {item.quantity}
        </Text>
      </View>
    </Pressable>
  );
}
