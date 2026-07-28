import Ionicons from '@expo/vector-icons/Ionicons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { styles as sharedStyles } from '@/components/farm/shared/styles';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { updateLocation } from '@/services/auth-service';

type LatLng = { latitude: number; longitude: number };

// Falls back to Tbilisi, Georgia when the user has no saved location and location access is
// unavailable/denied — better than centering on the middle of the ocean (0,0).
const DEFAULT_POSITION: LatLng = { latitude: 41.7151, longitude: 44.8271 };

// A Leaflet/OpenStreetMap page rendered inside a WebView — unlike react-native-maps, this needs
// no native module, so it works in Expo Go without a custom dev client. Tapping or dragging the
// marker posts the new coordinate back to React Native via postMessage; `setMarkerPosition` is
// exposed for React Native to call back into (e.g. after a "use current location" GPS fix).
function buildMapHtml(start: LatLng): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>html, body, #map { height: 100%; margin: 0; padding: 0; }</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: true }).setView([${start.latitude}, ${start.longitude}], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    var marker = L.marker([${start.latitude}, ${start.longitude}], { draggable: true }).addTo(map);

    function sendPosition(latlng) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ latitude: latlng.lat, longitude: latlng.lng }));
    }

    marker.on('dragend', function () { sendPosition(marker.getLatLng()); });
    map.on('click', function (e) {
      marker.setLatLng(e.latlng);
      sendPosition(e.latlng);
    });

    window.setMarkerPosition = function (lat, lng) {
      marker.setLatLng([lat, lng]);
      map.setView([lat, lng], 15);
    };
  </script>
</body>
</html>`;
}

export default function ProfileLocationScreen() {
  const { t } = useLanguage();
  const { user, refreshUser } = useAuth();

  const initialPosition: LatLng =
    user?.latitude != null && user?.longitude != null
      ? { latitude: user.latitude, longitude: user.longitude }
      : DEFAULT_POSITION;

  const [mapHtml] = useState(() => buildMapHtml(initialPosition));
  const [marker, setMarker] = useState<LatLng>(initialPosition);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView | null>(null);

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data) as LatLng;
      setMarker(data);
    } catch {
      // Ignore malformed messages from the page.
    }
  }

  async function useCurrentLocation() {
    setLocating(true);
    setError(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError(t('profile.locationPermissionDenied'));
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      const next = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      setMarker(next);
      webViewRef.current?.injectJavaScript(
        `window.setMarkerPosition(${next.latitude}, ${next.longitude}); true;`
      );
    } catch {
      setError(t('profile.locationError'));
    } finally {
      setLocating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateLocation(marker.latitude, marker.longitude);
      await refreshUser();
      router.back();
    } catch {
      setError(t('profile.locationSaveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={sharedStyles.safeArea} edges={['top']}>
      <View style={sharedStyles.header}>
        <Pressable
          style={sharedStyles.headerSide}
          hitSlop={8}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={Brand.dark} />
        </Pressable>
        <Text style={sharedStyles.headerTitle}>{t('profile.setLocation')}</Text>
        <View style={sharedStyles.headerSide}>
          <LanguageToggle />
        </View>
      </View>

      <Text style={local.hint}>{t('profile.locationHint')}</Text>

      <View style={local.mapWrap}>
        <WebView
          ref={webViewRef}
          style={StyleSheet.absoluteFill}
          source={{ html: mapHtml }}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
        />

        <Pressable
          style={local.locateButton}
          onPress={useCurrentLocation}
          disabled={locating}
          accessibilityRole="button"
          accessibilityLabel={t('profile.useCurrentLocation')}>
          {locating ? <ActivityIndicator color={Brand.green} /> : <Ionicons name="locate" size={22} color={Brand.green} />}
        </Pressable>
      </View>

      {error ? <Text style={[sharedStyles.errorText, local.errorText]}>{error}</Text> : null}

      <View style={sharedStyles.formActions}>
        <Pressable style={sharedStyles.formCancelButton} onPress={() => router.back()}>
          <Text style={sharedStyles.formCancelLabel}>{t('common.cancel')}</Text>
        </Pressable>
        <Pressable
          style={[sharedStyles.formSubmitButton, saving && sharedStyles.formSubmitButtonDisabled]}
          onPress={handleSave}
          disabled={saving}>
          {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={sharedStyles.formSubmitLabel}>{t('common.save')}</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const local = StyleSheet.create({
  hint: {
    fontSize: 13,
    color: Brand.muted,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  mapWrap: {
    flex: 1,
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Brand.border,
  },
  locateButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  errorText: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
});
