import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '@/components/farm/shared/styles';
import { ImageSlider } from '@/components/market/image-slider';
import {
  LISTING_CATEGORY_ICON,
  LISTING_CATEGORY_LABEL_KEY,
  listingImage,
  listingItemLabel,
} from '@/components/market/market-listing';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { getMarketListing } from '@/services/market-listing-service';
import type { MarketListing } from '@/types/market-listing';

export default function MarketListingDetailScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ id: string }>();
  const listingId = Number(params.id);

  const [listing, setListing] = useState<MarketListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setListing(await getMarketListing(listingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const typeLabel = listing ? listingItemLabel(listing.category, listing.itemType, t) : '';
  const title = listing ? listing.title.trim() || typeLabel : '';
  const fallbackImage = listing ? listingImage(listing.category, listing.itemType) : null;
  const isCompleted = listing?.status === 'Completed';
  const sellerFullName = listing ? [listing.sellerName, listing.sellerSurname].filter(Boolean).join(' ') : '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerSide}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={Brand.dark} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || t('market.title')}
        </Text>
        <View style={styles.headerSide}>
          <LanguageToggle />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={Brand.dark} />
          </View>
        ) : error || !listing ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorText}>{t('market.loadError')}</Text>
            <Pressable style={styles.retryButton} onPress={load}>
              <Text style={styles.retryButtonLabel}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {listing.imagePaths.length > 0 ? (
              <ImageSlider images={listing.imagePaths.map(resolveAssetUrl)} />
            ) : (
              <View style={styles.historyHeroPlaceholder}>
                {fallbackImage ? (
                  <Image source={fallbackImage} style={local.heroFallbackImage} contentFit="contain" />
                ) : (
                  <Ionicons name={LISTING_CATEGORY_ICON[listing.category]} size={48} color={Brand.dark} />
                )}
              </View>
            )}

            <View style={local.titleRow}>
              <Text style={local.title}>{title}</Text>
              <View style={[local.statusBadge, isCompleted && local.statusBadgeCompleted]}>
                <Text style={[local.statusBadgeText, isCompleted && local.statusBadgeTextCompleted]}>
                  {isCompleted ? t('market.statusCompleted') : t('market.statusActive')}
                </Text>
              </View>
            </View>

            <Text style={local.price}>
              ${listing.price}
              {listing.priceUnit ? ` / ${listing.priceUnit}` : ''}
            </Text>

            {listing.description ? <Text style={local.description}>{listing.description}</Text> : null}

            <View style={styles.landDetailsBlock}>
              <Text style={styles.cardSubtitle}>
                {t('market.categoryLabel')}: {t(LISTING_CATEGORY_LABEL_KEY[listing.category])}
              </Text>
              {listing.quantity != null ? (
                <Text style={styles.cardSubtitle}>
                  {t('market.quantity')}: {listing.quantity}
                </Text>
              ) : null}
              {listing.location ? (
                <Text style={styles.cardSubtitle}>
                  {t('market.location')}: {listing.location}
                </Text>
              ) : null}
              <Text style={styles.cardSubtitle}>
                {t('market.listedOn')}: {new Date(listing.createdAt).toLocaleDateString()}
              </Text>
            </View>

            <Text style={local.sectionLabel}>{t('market.seller')}</Text>
            <View style={local.sellerCard}>
              <View style={local.sellerAvatarWrap}>
                {listing.sellerImagePath ? (
                  <Image
                    source={{ uri: resolveAssetUrl(listing.sellerImagePath) }}
                    style={local.sellerAvatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <Ionicons name="person" size={20} color={Brand.green} />
                )}
              </View>
              <View style={local.sellerInfo}>
                <Text style={local.sellerName}>{sellerFullName}</Text>
                {listing.sellerPhoneNumber ? (
                  <Pressable
                    style={local.sellerPhoneRow}
                    onPress={() => Linking.openURL(`tel:${listing.sellerPhoneNumber}`)}
                    accessibilityRole="button"
                    accessibilityLabel={listing.sellerPhoneNumber}>
                    <Ionicons name="call-outline" size={13} color={Brand.green} />
                    <Text style={local.sellerPhone}>{listing.sellerPhoneNumber}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const local = StyleSheet.create({
  heroFallbackImage: {
    width: 96,
    height: 96,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Brand.dark,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: Brand.green,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: Brand.dark,
    lineHeight: 20,
    marginBottom: 16,
  },
  statusBadge: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeCompleted: {
    backgroundColor: Brand.greenMuted,
    borderColor: Brand.greenMuted,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Brand.muted,
  },
  statusBadgeTextCompleted: {
    color: Brand.green,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.muted,
    marginBottom: 8,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  sellerAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.greenMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sellerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.dark,
  },
  sellerPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  sellerPhone: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.green,
  },
});
