import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { router, Tabs, usePathname } from 'expo-router';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { useLogout } from '@/hooks/use-logout';

const DANGER = '#DC2626';

function FloatingNavButtons() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { confirmSignOut, signingOut } = useLogout();
  const isProfile = pathname === '/profile';
  const isScanner = pathname === '/scanner';

  function haptic() {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  function goHome() {
    haptic();
    router.push('/');
  }

  function handleRightPress() {
    haptic();
    if (isProfile) {
      confirmSignOut();
    } else {
      router.push('/profile');
    }
  }

  function goScanHistory() {
    haptic();
    router.push('/scanner-history');
  }

  return (
    <View style={[styles.floatingRow, { bottom: insets.bottom + 16 }]} pointerEvents="box-none">
      <Pressable
        style={[styles.circleButton, !isProfile && styles.circleButtonActive]}
        onPress={goHome}
        accessibilityRole="button"
        accessibilityLabel="Home">
        <Ionicons name={isProfile ? 'home-outline' : 'home'} size={26} color={!isProfile ? '#FFFFFF' : Brand.dark} />
      </Pressable>
      <View style={styles.floatingRightGroup}>
        {isScanner && (
          <Pressable
            style={styles.circleButton}
            onPress={goScanHistory}
            accessibilityRole="button"
            accessibilityLabel="Scan history">
            <Ionicons name="time-outline" size={26} color={Brand.dark} />
          </Pressable>
        )}
        <Pressable
          style={[styles.circleButton, isProfile && styles.circleButtonDanger]}
          onPress={handleRightPress}
          disabled={isProfile && signingOut}
          accessibilityRole="button"
          accessibilityLabel={isProfile ? 'Log out' : 'Profile'}>
          {isProfile && signingOut ? (
            <ActivityIndicator color={DANGER} />
          ) : (
            <Ionicons
              name={isProfile ? 'log-out-outline' : 'person-outline'}
              size={26}
              color={isProfile ? DANGER : Brand.dark}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { t } = useLanguage();

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}>
        <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
        <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
        {/* Reachable via quick-access tiles, not bottom-bar buttons — href: null keeps them part of
            the Tabs navigator (so routing/back behavior stays consistent) without a tab bar entry. */}
        <Tabs.Screen name="market" options={{ href: null }} />
        <Tabs.Screen name="chat" options={{ href: null }} />
        <Tabs.Screen name="farm" options={{ href: null }} />
        <Tabs.Screen name="harvest" options={{ href: null }} />
        <Tabs.Screen name="report" options={{ href: null }} />
        <Tabs.Screen name="workers" options={{ href: null }} />
        <Tabs.Screen name="scanner" options={{ href: null }} />
        <Tabs.Screen name="calendar" options={{ href: null }} />
        <Tabs.Screen name="profile-location" options={{ href: null }} />
        <Tabs.Screen name="scanner-history" options={{ href: null }} />
      </Tabs>
      <FloatingNavButtons />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  floatingRow: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  floatingRightGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  circleButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Brand.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  circleButtonActive: {
    backgroundColor: Brand.green,
    borderColor: Brand.green,
  },
  circleButtonDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
});
