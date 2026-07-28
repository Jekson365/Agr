import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { FONT_FAMILY } from '@/components/patched-text';
import { AppLoadingOverlay } from '@/components/ui/app-loading-overlay';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { CurrencyProvider } from '@/contexts/currency-context';
import { LanguageProvider } from '@/contexts/language-context';
import { NotificationsProvider } from '@/contexts/notifications-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

// How long the post-sign-in loading screen stays up, giving the newly
// mounted (tabs) screen time to kick off its data fetches in the background.
const POST_SIGN_IN_LOADING_MS = 900;

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showBootOverlay, setShowBootOverlay] = useState(false);
  const wasAuthenticatedRef = useRef(isAuthenticated);
  const wasLoadingRef = useRef(isLoading);

  useEffect(() => {
    // Only trigger for an explicit sign-in/registration, not for the silent
    // session restore on cold start (which flips isLoading and isAuthenticated together).
    const justFinishedRestore = wasLoadingRef.current && !isLoading;
    const justSignedIn = !wasAuthenticatedRef.current && isAuthenticated;
    wasAuthenticatedRef.current = isAuthenticated;
    wasLoadingRef.current = isLoading;

    if (justSignedIn && !justFinishedRestore) {
      setShowBootOverlay(true);
      const timer = setTimeout(() => setShowBootOverlay(false), POST_SIGN_IN_LOADING_MS);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    // Restoring the persisted session; hold on a blank screen to avoid flashing the login form.
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Protected guard={!isAuthenticated}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={isAuthenticated}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      {showBootOverlay && <AppLoadingOverlay />}
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    [FONT_FAMILY]: require('@/assets/fonts/bpg-boxo-boxo-webfont.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <LanguageProvider>
          <CurrencyProvider>
            <AuthProvider>
              <NotificationsProvider>
                <RootNavigator />
              </NotificationsProvider>
            </AuthProvider>
          </CurrencyProvider>
        </LanguageProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
