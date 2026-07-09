import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';

function AddTabButton({ onPress }: { onPress?: BottomTabBarButtonProps['onPress'] }) {
  return (
    <Pressable style={styles.addButton} onPress={onPress} accessibilityLabel="Quick add" accessibilityRole="button">
      <Ionicons name="add" size={28} color="#FFFFFF" />
    </Pressable>
  );
}

export default function TabLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: Brand.green,
        tabBarInactiveTintColor: Brand.muted,
        tabBarStyle: styles.tabBar,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: t('tabs.market'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarButton: (props) => <AddTabButton onPress={props.onPress} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/modal');
          },
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t('tabs.chat'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      {/* Reachable via quick-access tiles, not bottom-bar buttons — href: null keeps them part of
          the Tabs navigator (so the tab bar stays visible) without showing a tab icon. */}
      <Tabs.Screen name="farm" options={{ href: null }} />
      <Tabs.Screen name="harvest" options={{ href: null }} />
      <Tabs.Screen name="workers" options={{ href: null }} />
      <Tabs.Screen name="scanner" options={{ href: null }} />
      <Tabs.Screen name="calendar" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 62,
    paddingTop: 6,
  },
  addButton: {
    alignSelf: 'center',
    top: -18,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.dark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
});
