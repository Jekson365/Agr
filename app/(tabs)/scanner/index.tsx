import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { styles } from '@/components/farm/shared/styles';
import { PlantScanResultCard } from '@/components/scanner/plant-scan-result-card';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { analyzePlantImage } from '@/services/plant-scan-service';
import type { PlantScanResult } from '@/types/plant-scan';

export default function ScannerScreen() {
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PlantScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Prompt for camera access as soon as the screen opens, so the live preview is ready to shoot.
  useEffect(() => {
    if (permission?.status === 'undetermined') {
      requestPermission();
    }
  }, [permission?.status, requestPermission]);

  async function capturePhoto() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo?.uri) {
        startScan(photo.uri);
      }
    } catch {
      setError(t('scanner.analyzeError'));
    } finally {
      setCapturing(false);
    }
  }

  async function pickFromLibrary() {
    const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!libraryPermission.granted) {
      setError(t('scanner.permissionDenied'));
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!picked.canceled) {
      startScan(picked.assets[0].uri);
    }
  }

  async function startScan(uri: string) {
    setImageUri(uri);
    setResult(null);
    setError(null);
    setAnalyzing(true);
    try {
      const scan = await analyzePlantImage(uri, language);
      setResult(scan);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('scanner.analyzeError'));
    } finally {
      setAnalyzing(false);
    }
  }

  function reset() {
    setImageUri(null);
    setResult(null);
    setError(null);
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
        <Text style={styles.headerTitle}>{t('scanner.title')}</Text>
        <View style={styles.headerSide}>
          <LanguageToggle />
        </View>
      </View>

      {imageUri ? (
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 88 }]}>
          <Image source={{ uri: imageUri }} style={local.preview} contentFit="cover" />

          {analyzing && (
            <View style={styles.stateBox}>
              <ActivityIndicator color={Brand.dark} />
              <Text style={local.analyzingText}>{t('scanner.analyzing')}</Text>
            </View>
          )}

          {error && !analyzing && (
            <View style={styles.stateBox}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={reset}>
                <Text style={styles.retryButtonLabel}>{t('common.retry')}</Text>
              </Pressable>
            </View>
          )}

          {result && !analyzing && <PlantScanResultCard result={result} />}

          {!analyzing && (
            <Pressable style={styles.addButton} onPress={reset}>
              <Ionicons name="scan-outline" size={18} color={Brand.dark} />
              <Text style={styles.addButtonLabel}>{t('scanner.scanAnother')}</Text>
            </Pressable>
          )}
        </ScrollView>
      ) : (
        <View style={[local.cameraScreen, { paddingBottom: insets.bottom + 88 }]}>
          <View style={local.cameraPreviewWrap}>
            {permission?.granted ? (
              <CameraView ref={cameraRef} style={local.cameraPreview} facing="back" />
            ) : (
              <View style={local.permissionBox}>
                {permission?.status === 'denied' ? (
                  <>
                    <Ionicons name="camera-outline" size={32} color={Brand.muted} />
                    <Text style={local.permissionText}>{t('scanner.cameraPermissionDenied')}</Text>
                    <Pressable style={local.grantButton} onPress={requestPermission}>
                      <Text style={local.grantButtonLabel}>{t('scanner.grantCameraAccess')}</Text>
                    </Pressable>
                  </>
                ) : (
                  <ActivityIndicator color={Brand.dark} />
                )}
              </View>
            )}
          </View>

          <Pressable
            style={[local.actionButton, (!permission?.granted || capturing) && local.actionButtonDisabled]}
            onPress={capturePhoto}
            disabled={!permission?.granted || capturing}>
            {capturing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="camera" size={20} color="#FFFFFF" />
                <Text style={local.actionButtonLabel}>{t('scanner.takePhoto')}</Text>
              </>
            )}
          </Pressable>

          <Pressable style={[local.actionButton, local.actionButtonSecondary]} onPress={pickFromLibrary}>
            <Ionicons name="images-outline" size={20} color={Brand.dark} />
            <Text style={[local.actionButtonLabel, local.actionButtonLabelSecondary]}>
              {t('scanner.uploadImage')}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const local = StyleSheet.create({
  cameraScreen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  cameraPreviewWrap: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Brand.greenMuted,
    marginBottom: 16,
  },
  cameraPreview: {
    flex: 1,
  },
  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  permissionText: {
    fontSize: 13,
    color: Brand.muted,
    textAlign: 'center',
  },
  grantButton: {
    backgroundColor: Brand.green,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 4,
  },
  grantButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: Brand.greenMuted,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Brand.green,
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Brand.border,
    marginBottom: 0,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButtonLabelSecondary: {
    color: Brand.dark,
  },
  analyzingText: {
    fontSize: 13,
    color: Brand.muted,
  },
});
