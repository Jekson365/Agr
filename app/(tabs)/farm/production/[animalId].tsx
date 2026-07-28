import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimalProductionView } from '@/components/farm/livestock/production-view';
import { styles } from '@/components/farm/shared/styles';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';

export default function AnimalProductionScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ animalId: string; label?: string }>();
  const animalId = Number(params.animalId);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // AnimalProductionView fetches its own data on mount; there's no load() to call here, so a
  // refresh remounts it via `key` and briefly shows the pull-to-refresh spinner.
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
        <Text style={styles.headerTitle}>{params.label || t('production.title')}</Text>
        <View style={styles.headerSide}>
          <LanguageToggle />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Brand.dark} />}>
        <AnimalProductionView key={refreshKey} target="animal" animalId={animalId} />
      </ScrollView>
    </SafeAreaView>
  );
}
