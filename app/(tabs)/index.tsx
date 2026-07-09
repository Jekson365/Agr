import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LanguageToggle } from '@/components/ui/language-toggle';
import { NotificationsSheet } from '@/components/ui/notifications-sheet';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { useNotifications } from '@/contexts/notifications-context';
import { getCurrentWeather } from '@/services/weather-service';
import type { CurrentWeather } from '@/types/weather';

type QuickAccessItem = {
  key: string;
  labelKey: string;
  icon: ImageSourcePropType;
  href: Parameters<typeof router.push>[0];
};

const QUICK_ACCESS: QuickAccessItem[] = [
  { key: 'farm', labelKey: 'dashboard.myFarm', icon: require('@/assets/icons/farm.png'), href: '/farm' },
  {
    key: 'harvest',
    labelKey: 'dashboard.harvest',
    icon: require('@/assets/icons/harvest.png'),
    href: '/harvest',
  },
  // {
  //   key: 'scanner',
  //   labelKey: 'dashboard.aiPlantScanner',
  //   icon: require('@/assets/icons/camera.png'),
  //   href: '/scanner',
  // },
  {
    key: 'marketplace',
    labelKey: 'dashboard.marketplace',
    icon: require('@/assets/icons/market.png'),
    href: '/market',
  },
  // {
  //   key: 'workers',
  //   labelKey: 'dashboard.workers',
  //   icon: require('@/assets/icons/community.png'),
  //   href: '/workers',
  // },
  // { key: 'chat', labelKey: 'dashboard.chat', icon: require('@/assets/icons/chat.png'), href: '/chat' },
  {
    key: 'calendar',
    labelKey: 'dashboard.calendar',
    icon: require('@/assets/icons/calendar.png'),
    href: '/calendar',
  },
];

const OVERVIEW = [
  { key: 'farmlands', value: 2, labelKey: 'dashboard.farmlands' },
  { key: 'livestock', value: 5, labelKey: 'dashboard.livestock' },
  { key: 'tasks', value: 3, labelKey: 'dashboard.upcomingTasks' },
];

function weatherIconName(weather: CurrentWeather | null): keyof typeof Ionicons.glyphMap {
  if (!weather) {
    return 'partly-sunny-outline';
  }
  const condition = weather.condition.toLowerCase();
  if (condition.includes('thunder')) return 'thunderstorm-outline';
  if (condition.includes('snow') || condition.includes('sleet') || condition.includes('ice')) return 'snow-outline';
  if (condition.includes('rain') || condition.includes('drizzle')) return 'rainy-outline';
  if (condition.includes('cloud') || condition.includes('overcast') || condition.includes('mist') || condition.includes('fog')) {
    return 'cloudy-outline';
  }
  return weather.isDay ? 'sunny-outline' : 'moon-outline';
}

export default function DashboardScreen() {
  const { t } = useLanguage();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [weatherFailed, setWeatherFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentWeather()
      .then((data) => {
        if (!cancelled) setWeather(data);
      })
      .catch(() => {
        if (!cancelled) setWeatherFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function openNotifications() {
    setNotificationsVisible(true);
    markAllRead();
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable hitSlop={8}>
            <Ionicons name="menu-outline" size={26} color={Brand.dark} />
          </Pressable>
          <Text style={styles.greeting}>{t('dashboard.greeting')}</Text>
          <View style={styles.headerActions}>
            <LanguageToggle />
            <Pressable hitSlop={8} onPress={openNotifications} accessibilityRole="button" accessibilityLabel="Notifications">
              <Ionicons name="notifications-outline" size={24} color={Brand.dark} />
              {unreadCount > 0 && <View style={styles.notificationBadge} />}
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('dashboard.quickAccess')}</Text>
        <View style={styles.quickAccessGrid}>
          {QUICK_ACCESS.map((item) => (
            <Pressable
              key={item.key}
              style={styles.quickAccessItem}
              onPress={() => router.push(item.href)}>
              <View style={styles.quickAccessIcon}>
                <Image source={item.icon} style={styles.quickAccessImage} resizeMode="contain" />
              </View>
              <Text style={styles.quickAccessLabel} numberOfLines={2}>
                {t(item.labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('dashboard.myOverview')}</Text>
        <View style={styles.overviewRow}>
          {OVERVIEW.map((item) => (
            <View key={item.key} style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{item.value}</Text>
              <Text style={styles.overviewLabel}>{t(item.labelKey)}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('dashboard.weather')}</Text>
        <View style={styles.weatherCard}>
          <View style={styles.weatherIcon}>
            <Ionicons name={weatherIconName(weather)} size={32} color={Brand.green} />
          </View>
          <View style={styles.weatherInfo}>
            {weather ? (
              <>
                <Text style={styles.weatherTemp}>{Math.round(weather.tempC)}°C</Text>
                <Text style={styles.weatherLocation}>{weather.location}</Text>
                <Text style={styles.weatherCondition}>{weather.condition}</Text>
              </>
            ) : (
              <Text style={styles.weatherCondition}>
                {weatherFailed ? t('dashboard.weatherUnavailable') : t('dashboard.weatherLoading')}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      <NotificationsSheet
        visible={notificationsVisible}
        notifications={notifications}
        onClose={() => setNotificationsVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Brand.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 17,
    fontWeight: '600',
    color: Brand.dark,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C0392B',
    borderWidth: 1,
    borderColor: Brand.background,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Brand.dark,
    marginBottom: 12,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 28,
    marginHorizontal: -6,
  },
  quickAccessItem: {
    width: '33.33%',
    paddingHorizontal: 1,
    marginBottom: 6,
    alignItems: 'center',
  },
  quickAccessIcon: {
    width: 100,
    height: 100,
    borderRadius: 13,
    backgroundColor: Brand.greenMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickAccessImage: {
    width: 70,
    height: 70,
  },
  quickAccessLabel: {
    fontSize: 12,
    color: Brand.dark,
    textAlign: 'center',
  },
  overviewRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  overviewCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Brand.dark,
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: Brand.muted,
    textAlign: 'center',
  },
  weatherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  weatherIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Brand.greenMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherInfo: {
    flex: 1,
  },
  weatherTemp: {
    fontSize: 20,
    fontWeight: '700',
    color: Brand.dark,
  },
  weatherLocation: {
    fontSize: 13,
    color: Brand.dark,
    marginTop: 2,
  },
  weatherCondition: {
    fontSize: 12,
    color: Brand.muted,
    marginTop: 1,
  },
});
