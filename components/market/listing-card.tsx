import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { styles } from '@/components/farm/shared/styles';
import {
  LISTING_CATEGORY_ICON,
  listingImage,
  listingItemLabel,
} from '@/components/market/market-listing';
import { Brand } from '@/constants/theme';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import type { MarketListing } from '@/types/market-listing';

type Props = {
  item: MarketListing;
  onPress?: () => void;
  onMenu?: () => void;
  onToggleStatus?: () => void;
};

export function ListingCard({ item, onPress, onMenu, onToggleStatus }: Props) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();
  const typeLabel = listingItemLabel(item.category, item.itemType, t);
  const title = item.title.trim() || typeLabel;
  const fallbackImage = listingImage(item.category, item.itemType);
  const isCompleted = item.status === 'Completed';
  const coverImage = item.imagePaths[0];

  return (
    <View style={styles.productCard}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title}>
        <View>
          {coverImage ? (
            <Image source={{ uri: resolveAssetUrl(coverImage) }} style={styles.productImage} contentFit="cover" />
          ) : (
            <View style={[styles.productImage, styles.productImageCentered]}>
              {fallbackImage ? (
                <Image source={fallbackImage} style={styles.stockIcon} contentFit="contain" />
              ) : (
                <Ionicons name={LISTING_CATEGORY_ICON[item.category]} size={32} color={Brand.dark} />
              )}
            </View>
          )}

          <View style={local.sellerBadge}>
            {item.sellerImagePath ? (
              <Image
                source={{ uri: resolveAssetUrl(item.sellerImagePath) }}
                style={local.sellerAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={[local.sellerAvatar, local.sellerAvatarFallback]}>
                <Ionicons name="person" size={11} color="#FFFFFF" />
              </View>
            )}
          </View>

          {item.imagePaths.length > 1 && (
            <View style={local.photoCountBadge}>
              <Ionicons name="images-outline" size={11} color="#FFFFFF" />
              <Text style={local.photoCountText}>{item.imagePaths.length}</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={local.price}>
            {formatPrice(item.price)}
            {item.priceUnit ? ` / ${item.priceUnit}` : ''}
          </Text>
          {item.location ? (
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {item.location}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {onToggleStatus && (
        <Pressable
          style={local.soldBadge}
          onPress={onToggleStatus}
          hitSlop={6}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isCompleted }}
          accessibilityLabel={isCompleted ? t('market.markActive') : t('market.markCompleted')}>
          <Ionicons
            name={isCompleted ? 'checkbox' : 'square-outline'}
            size={16}
            color={isCompleted ? Brand.green : Brand.muted}
          />
          <Text style={[local.soldBadgeText, isCompleted && local.soldBadgeTextChecked]}>{t('market.sold')}</Text>
        </Pressable>
      )}

      {onMenu && (
        <Pressable style={styles.productMenuButton} hitSlop={8} onPress={onMenu}>
          <Ionicons name="ellipsis-vertical" size={16} color={Brand.muted} />
        </Pressable>
      )}
    </View>
  );
}

const local = StyleSheet.create({
  price: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.green,
    marginBottom: 2,
  },
  soldBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  soldBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Brand.muted,
  },
  soldBadgeTextChecked: {
    color: Brand.green,
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  photoCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sellerBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
  },
  sellerAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  sellerAvatarFallback: {
    backgroundColor: Brand.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
