import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StockFeedRow } from '@/components/farm/livestock/feed';
import { StockHistoryView } from '@/components/farm/livestock/history';
import { MedicalRecordsView } from '@/components/farm/livestock/medical-records';
import { AnimalProductionView } from '@/components/farm/livestock/production-view';
import { styles } from '@/components/farm/shared/styles';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';

type Tab = 'weight' | 'production' | 'medical';

export default function StockHistoryScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ stockId: string; livestockId: string; label?: string; image?: string }>();
  const stockId = Number(params.stockId);
  const livestockId = Number(params.livestockId);
  const [tab, setTab] = useState<Tab>('weight');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // These child views fetch their own data on mount; there's no load() to call here, so a
  // refresh remounts them via `key` and briefly shows the pull-to-refresh spinner.
  function onRefresh() {
    setRefreshing(true);
    setRefreshKey((key) => key + 1);
    setTimeout(() => setRefreshing(false), 400);
  }

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
        <Text style={styles.headerTitle}>{params.label || t('history.title')}</Text>
        <View style={styles.headerSide}>
          <LanguageToggle />
        </View>
      </View>

      <View style={styles.tabRow}>
        <Pressable style={styles.tabItem} onPress={() => setTab('weight')}>
          <Text style={[styles.tabLabel, tab === 'weight' && styles.tabLabelActive]}>
            {t('history.weightTab')}
          </Text>
          {tab === 'weight' && <View style={styles.tabIndicator} />}
        </Pressable>
        <Pressable style={styles.tabItem} onPress={() => setTab('production')}>
          <Text style={[styles.tabLabel, tab === 'production' && styles.tabLabelActive]}>
            {t('history.productionTab')}
          </Text>
          {tab === 'production' && <View style={styles.tabIndicator} />}
        </Pressable>
        <Pressable style={styles.tabItem} onPress={() => setTab('medical')}>
          <Text style={[styles.tabLabel, tab === 'medical' && styles.tabLabelActive]}>
            {t('history.medicalTab')}
          </Text>
          {tab === 'medical' && <View style={styles.tabIndicator} />}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.dark} />}>
        {params.image ? (
          <Image
            source={{ uri: resolveAssetUrl(params.image) }}
            style={styles.historyHeroImage}
            contentFit="cover"
          />
        ) : (
          <View style={styles.historyHeroPlaceholder}>
            <Ionicons name="image-outline" size={48} color={Brand.muted} />
          </View>
        )}

        {tab === 'weight' ? (
          <>
            {livestockId ? <StockFeedRow key={refreshKey} livestockId={livestockId} /> : null}
            <StockHistoryView key={refreshKey} stockId={stockId} />
          </>
        ) : tab === 'production' ? (
          <AnimalProductionView key={refreshKey} target="animal" animalId={stockId} />
        ) : (
          <MedicalRecordsView key={refreshKey} stockId={stockId} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
