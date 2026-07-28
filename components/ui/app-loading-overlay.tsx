import { Image } from 'expo-image';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useLanguage } from '@/contexts/language-context';

export function AppLoadingOverlay() {
  const { t } = useLanguage();

  return (
    <View style={styles.root}>
      <Image
        source={require('@/assets/farmland.png')}
        style={styles.backgroundImage}
        contentFit="cover"
      />
      <View style={styles.scrim} />
      <View style={styles.content}>
        <View style={styles.logoBadge}>
          <Image source={require('@/assets/logo.png')} style={styles.logoImage} contentFit="contain" />
        </View>
        <Text style={styles.appName}>{t('auth.appName')}</Text>
        <Text style={styles.appTagline}>{t('auth.tagline')}</Text>
        <ActivityIndicator color="#FFFFFF" style={styles.spinner} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 42, 36, 0.18)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  appName: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  appTagline: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  spinner: {
    marginTop: 20,
  },
});
