import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatTime, toIsoDate } from '@/components/ui/date-utils';
import { GreetingPopup } from '@/components/ui/greeting-popup';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { NotificationsSheet } from '@/components/ui/notifications-sheet';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { useNotifications } from '@/contexts/notifications-context';
import { resolveAssetUrl } from '@/services/api-client';
import { getCalendarEvents } from '@/services/calendar-service';
import { getCurrentWeather } from '@/services/weather-service';
import type { CalendarEvent } from '@/types/calendar';
import type { CurrentWeather } from '@/types/weather';

type QuickAccessItem = {
  key: string;
  labelKey: string;
  icon?: ImageSourcePropType;
  ionicon?: keyof typeof Ionicons.glyphMap;
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
  {
    key: 'scanner',
    labelKey: 'dashboard.aiPlantScanner',
    icon: require('@/assets/icons/camera.png'),
    href: '/scanner',
  },
  {
    key: 'marketplace',
    labelKey: 'dashboard.marketplace',
    icon: require('@/assets/icons/market.png'),
    href: '/market',
  },
  {
    key: 'report',
    labelKey: 'dashboard.report',
    icon: require('@/assets/icons/report.png'),
    href: '/report',
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

function initialsFor(name: string | undefined): string {
  return (name ?? '')
    .split(' ')
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function DashboardScreen() {
  const { t } = useLanguage();
  const { user, justSignedIn, acknowledgeSignIn } = useAuth();
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [greetingVisible, setGreetingVisible] = useState(false);

  useEffect(() => {
    if (justSignedIn) {
      setGreetingVisible(true);
      acknowledgeSignIn();
    }
  }, [justSignedIn, acknowledgeSignIn]);
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [weatherFailed, setWeatherFailed] = useState(false);

  const [todaysEvents, setTodaysEvents] = useState<CalendarEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(false);

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

  // Re-fetch whenever the dashboard regains focus, so an event added/removed from the Calendar
  // screen is reflected here without needing a manual refresh.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setEventsLoading(true);
      setEventsError(false);
      getCalendarEvents()
        .then((all) => {
          if (cancelled) return;
          const todayKey = toIsoDate(new Date());
          setTodaysEvents(all.filter((e) => e.date === todayKey).sort((a, b) => a.time.localeCompare(b.time)));
        })
        .catch(() => {
          if (!cancelled) setEventsError(true);
        })
        .finally(() => {
          if (!cancelled) setEventsLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  function openNotifications() {
    setNotificationsVisible(true);
    markAllRead();
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable style={styles.userChip} onPress={() => router.push('/profile')}>
            <View style={styles.userAvatar}>
              {user?.imagePath ? (
                <Image source={{ uri: resolveAssetUrl(user.imagePath) }} style={styles.userAvatarImage} resizeMode="cover" />
              ) : (
                <Text style={styles.userAvatarText}>{initialsFor(user?.name)}</Text>
              )}
            </View>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.name}
            </Text>
          </Pressable>
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
                {item.icon ? (
                  <Image source={item.icon} style={styles.quickAccessImage} resizeMode="contain" />
                ) : item.ionicon ? (
                  <Ionicons name={item.ionicon} size={40} color={Brand.green} />
                ) : null}
              </View>
              <Text style={styles.quickAccessLabel} numberOfLines={2}>
                {t(item.labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('dashboard.todaysEvents')}</Text>
          <Pressable onPress={() => router.push('/calendar')} hitSlop={8}>
            <Text style={styles.seeAllLabel}>{t('dashboard.seeAll')}</Text>
          </Pressable>
        </View>
        {eventsLoading ? (
          <View style={styles.eventsStateBox}>
            <ActivityIndicator color={Brand.dark} />
          </View>
        ) : eventsError ? (
          <Text style={styles.eventsEmptyText}>{t('dashboard.eventsLoadError')}</Text>
        ) : todaysEvents.length === 0 ? (
          <Text style={styles.eventsEmptyText}>{t('dashboard.noEventsToday')}</Text>
        ) : (
          <View style={styles.eventsList}>
            {todaysEvents.map((item) => (
              <Pressable key={item.id} style={styles.eventRow} onPress={() => router.push('/calendar')}>
                <Text style={styles.eventRowTime}>{formatTime(item.time)}</Text>
                <Text style={styles.eventRowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* <Text style={styles.sectionTitle}>{t('dashboard.myOverview')}</Text>
        <View style={styles.overviewRow}>
          {OVERVIEW.map((item) => (
            <View key={item.key} style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{item.value}</Text>
              <Text style={styles.overviewLabel}>{t(item.labelKey)}</Text>
            </View>
          ))}
        </View> */}

        <Text style={styles.sectionTitle}>{t('dashboard.weather')}</Text>
        <View style={styles.weatherCard}>
          <View style={styles.weatherIcon}>
            <Ionicons name={weatherIconName(weather)} size={32} color={Brand.green} />
          </View>
          <View style={styles.weatherInfo}>
            {weather ? (
              <>
                <Text style={styles.weatherTemp}>{Math.round(weather.tempC)}°C</Text>
                {/* <Text style={styles.weatherLocation}>{weather.location}</Text> */}
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

      <GreetingPopup visible={greetingVisible} onClose={() => setGreetingVisible(false)} />
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
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Brand.greenMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  userAvatarImage: {
    width: '100%',
    height: '100%',
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Brand.green,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: Brand.dark,
    flexShrink: 1,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAllLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.green,
    marginBottom: 12,
  },
  eventsStateBox: {
    paddingVertical: 12,
    marginBottom: 16,
  },
  eventsEmptyText: {
    fontSize: 13,
    color: Brand.muted,
    marginBottom: 16,
  },
  eventsList: {
    marginBottom: 16,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  eventRowTime: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.green,
  },
  eventRowTitle: {
    flex: 1,
    fontSize: 14,
    color: Brand.dark,
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
