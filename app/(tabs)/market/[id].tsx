import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles } from '@/components/farm/shared/styles';
import { ImageSlider } from '@/components/market/image-slider';
import {
  LISTING_CATEGORY_ICON,
  LISTING_CATEGORY_LABEL_KEY,
  listingImage,
  listingItemLabel,
} from '@/components/market/market-listing';
import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { getMarketListing } from '@/services/market-listing-service';
import type { MarketListing } from '@/types/market-listing';

export default function MarketListingDetailScreen() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const params = useLocalSearchParams<{ id: string }>();
  const listingId = Number(params.id);

  const [listing, setListing] = useState<MarketListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId]);

  async function load(opts?: { silent?: boolean }) {
    if (!opts?.silent) setLoading(true);
    setError(null);
    try {
      setListing(await getMarketListing(listingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (!opts?.silent) setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    load({ silent: true });
  }

  const typeLabel = listing ? listingItemLabel(listing.category, listing.itemType, t) : '';
  const title = listing ? listing.title.trim() || typeLabel : '';
  const fallbackImage = listing ? listingImage(listing.category, listing.itemType) : null;
  const isCompleted = listing?.status === 'Completed';
  const sellerFullName = listing ? [listing.sellerName, listing.sellerSurname].filter(Boolean).join(' ') : '';
  const kindLabel = listing
    ? listing.itemType.trim() !== ''
      ? typeLabel
      : listing.category !== 'Other'
        ? t(LISTING_CATEGORY_LABEL_KEY[listing.category])
        : ''
    : '';

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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.dark} />}>
        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={Brand.dark} />
          </View>
        ) : error || !listing ? (
          <View style={styles.stateBox}>
            <Text style={styles.errorText}>{t('market.loadError')}</Text>
            <Pressable style={styles.retryButton} onPress={() => load()}>
              <Text style={styles.retryButtonLabel}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={local.heroWrap}>
              {listing.imagePaths.length > 0 ? (
                <ImageSlider images={listing.imagePaths.map(resolveAssetUrl)} height={260} />
              ) : (
                <View style={local.heroPlaceholder}>
                  {fallbackImage ? (
                    <Image source={fallbackImage} style={local.heroFallbackImage} contentFit="contain" />
                  ) : (
                    <Ionicons name={LISTING_CATEGORY_ICON[listing.category]} size={56} color={Brand.green} />
                  )}
                </View>
              )}
              <View style={[local.statusBadge, isCompleted && local.statusBadgeCompleted]}>
                <View style={[local.statusDot, isCompleted && local.statusDotCompleted]} />
                <Text style={[local.statusBadgeText, isCompleted && local.statusBadgeTextCompleted]}>
                  {isCompleted ? t('market.statusCompleted') : t('market.statusActive')}
                </Text>
              </View>
            </View>

            <View style={local.titleBlock}>
              <Text style={local.title}>{title}</Text>
              <View style={local.priceRow}>
                <Text style={local.price}>{formatPrice(listing.price)}</Text>
                {listing.priceUnit ? <Text style={local.priceUnit}>/ {listing.priceUnit}</Text> : null}
              </View>
            </View>

            <View style={local.metaRow}>
              {kindLabel ? (
                <View style={local.metaChip}>
                  <Ionicons name={LISTING_CATEGORY_ICON[listing.category]} size={14} color={Brand.green} />
                  <Text style={local.metaChipText}>{kindLabel}</Text>
                </View>
              ) : null}
              {listing.location ? (
                <View style={local.metaChip}>
                  <Ionicons name="location-outline" size={14} color={Brand.green} />
                  <Text style={local.metaChipText}>{listing.location}</Text>
                </View>
              ) : null}
              {listing.quantity != null ? (
                <View style={local.metaChip}>
                  <Ionicons name="cube-outline" size={14} color={Brand.green} />
                  <Text style={local.metaChipText}>{listing.quantity}</Text>
                </View>
              ) : null}
              <View style={local.metaChip}>
                <Ionicons name="calendar-outline" size={14} color={Brand.green} />
                <Text style={local.metaChipText}>{formatLocalizedIsoDate(listing.createdAt, language)}</Text>
              </View>
            </View>

            {listing.description ? (
              <View style={local.section}>
                <Text style={local.sectionLabel}>{t('market.description')}</Text>
                <View style={local.descriptionCard}>
                  <Text style={local.description}>{listing.description}</Text>
                </View>
              </View>
            ) : null}

            <View style={local.section}>
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
                    <Ionicons name="person" size={22} color={Brand.green} />
                  )}
                </View>
                <View style={local.sellerInfo}>
                  <Text style={local.sellerName} numberOfLines={1}>
                    {sellerFullName}
                  </Text>
                  {listing.sellerPhoneNumber ? (
                    <Text style={local.sellerPhone} numberOfLines={1}>
                      {listing.sellerPhoneNumber}
                    </Text>
                  ) : null}
                </View>
                {listing.sellerPhoneNumber ? (
                  <Pressable
                    style={local.callButton}
                    onPress={() => Linking.openURL(`tel:${listing.sellerPhoneNumber}`)}
                    accessibilityRole="button"
                    accessibilityLabel={listing.sellerPhoneNumber}>
                    <Ionicons name="call" size={15} color="#FFFFFF" />
                    <Text style={local.callButtonText}>{t('market.call')}</Text>
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
  heroWrap: {
    position: 'relative',
  },
  heroPlaceholder: {
    width: '100%',
    height: 260,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: Brand.greenMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFallbackImage: {
    width: 110,
    height: 110,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  statusBadgeCompleted: {
    backgroundColor: 'rgba(234,244,238,0.95)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Brand.green,
  },
  statusDotCompleted: {
    backgroundColor: Brand.muted,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.dark,
  },
  statusBadgeTextCompleted: {
    color: Brand.muted,
  },
  titleBlock: {
    marginBottom: 12,
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: Brand.dark,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  price: {
    fontSize: 22,
    fontWeight: '700',
    color: Brand.green,
  },
  priceUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: Brand.muted,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.greenMuted,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  metaChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.dark,
  },
  section: {
    marginBottom: 22,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  descriptionCard: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 14,
    padding: 14,
  },
  description: {
    fontSize: 14,
    color: Brand.dark,
    lineHeight: 21,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 16,
    padding: 14,
  },
  sellerAvatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    fontWeight: '700',
    color: Brand.dark,
  },
  sellerPhone: {
    fontSize: 13,
    color: Brand.muted,
    marginTop: 2,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.green,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  callButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
