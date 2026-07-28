import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { styles } from '@/components/farm/shared/styles';
import { DateField } from '@/components/ui/date-field';
import { formatLocalizedIsoDate, toIsoDate, type DateLanguage } from '@/components/ui/date-utils';
import { FullScreenImageViewer } from '@/components/ui/fullscreen-image-viewer';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import {
  createStockPhoto,
  deleteStockPhoto,
  getStockPhotos,
  uploadStockPhotoImage,
} from '@/services/stock-photo-service';
import type { StockPhoto } from '@/types/stock-photo';

type Props = {
  stockId: number;
};

/**
 * Photo history for a single stock: a grid of photos each tagged with the date they were taken,
 * plus an "add photo" flow that lets the user pick one or more images and assign them a shared date.
 */
export function StockPhotoHistoryView({ stockId }: Props) {
  const { t, language } = useLanguage();

  const [photos, setPhotos] = useState<StockPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const [addVisible, setAddVisible] = useState(false);
  const [pickedUris, setPickedUris] = useState<string[]>([]);
  const [takenAt, setTakenAt] = useState<string | null>(toIsoDate(new Date()));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!stockId) return;
    load(stockId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockId]);

  async function load(id: number) {
    setLoading(true);
    setError(null);
    try {
      setPhotos(await getStockPhotos(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setPickedUris([]);
    setTakenAt(toIsoDate(new Date()));
    setFormError(null);
    setAddVisible(true);
  }

  async function pickImages() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError(t('farm.imagePermissionDenied'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setPickedUris((prev) => [...prev, ...result.assets.map((asset) => asset.uri)]);
    }
  }

  function removePickedImage(uri: string) {
    setPickedUris((prev) => prev.filter((u) => u !== uri));
  }

  const canSubmit = pickedUris.length > 0 && !!takenAt && !saving;

  async function handleSubmit() {
    if (!canSubmit || !takenAt) return;

    setSaving(true);
    setFormError(null);
    try {
      const uploadedPaths = await Promise.all(pickedUris.map((uri) => uploadStockPhotoImage(uri)));
      const created = await Promise.all(
        uploadedPaths.map((imagePath) => createStockPhoto({ stockId, imagePath, takenAt }))
      );
      setPhotos((prev) => [...created, ...prev].sort((a, b) => (a.takenAt < b.takenAt ? 1 : -1)));
      setAddVisible(false);
    } catch {
      setFormError(t('stockPhoto.saveError'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteStockPhoto(id);
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  if (loading) {
    return (
      <View style={styles.stateBox}>
        <ActivityIndicator color={Brand.dark} />
      </View>
    );
  }

  return (
    <>
      {photos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>{t('stockPhoto.empty')}</Text>
        </View>
      ) : (
        <View style={styles.productGrid}>
          {photos.map((photo, index) => (
            <View key={photo.id} style={styles.productCard}>
              <Pressable onPress={() => setViewerIndex(index)} accessibilityRole="button">
                <Image
                  source={{ uri: resolveAssetUrl(photo.imagePath) }}
                  style={styles.productImage}
                  contentFit="cover"
                />
                <View style={styles.productInfo}>
                  <Text style={local.photoDate}>{formatDate(photo.takenAt, language)}</Text>
                </View>
              </Pressable>
              <Pressable
                style={styles.productMenuButton}
                hitSlop={8}
                onPress={() => handleDelete(photo.id)}
                accessibilityRole="button"
                accessibilityLabel={t('common.delete')}>
                <Ionicons name="trash-outline" size={14} color={Brand.muted} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <FullScreenImageViewer
        key={viewerIndex ?? 'closed'}
        visible={viewerIndex !== null}
        images={photos.map((photo) => ({ uri: resolveAssetUrl(photo.imagePath), caption: formatDate(photo.takenAt, language) }))}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
      />

      {error ? <Text style={styles.errorText}>{t('stockPhoto.loadError')}</Text> : null}

      <Pressable style={styles.addButton} onPress={openAdd}>
        <Ionicons name="add" size={18} color="#FFFFFF" />
        <Text style={styles.addButtonLabel}>{t('stockPhoto.addPhoto')}</Text>
      </Pressable>

      <Modal visible={addVisible} transparent animationType="slide" onRequestClose={() => setAddVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.formOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAddVisible(false)} />
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{t('stockPhoto.addPhoto')}</Text>

            <ScrollView style={styles.formScrollArea}>
              <Text style={styles.fieldLabel}>{t('stockPhoto.takenAt')}</Text>
              <DateField
                value={takenAt}
                onChange={setTakenAt}
                placeholder={t('stockPhoto.takenAtPlaceholder')}
                maximumDate={new Date()}
              />

              <Text style={styles.fieldLabel}>{t('market.image')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={local.imageRow}>
                {pickedUris.map((uri) => (
                  <View key={uri} style={local.imageThumbWrap}>
                    <Image source={{ uri }} style={local.imageThumb} contentFit="cover" />
                    <Pressable
                      style={local.imageRemoveButton}
                      hitSlop={8}
                      onPress={() => removePickedImage(uri)}
                      accessibilityRole="button"
                      accessibilityLabel={t('common.delete')}>
                      <Ionicons name="close" size={14} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ))}
                <Pressable style={styles.imagePickerPlaceholder} onPress={pickImages}>
                  <Ionicons name="add" size={24} color={Brand.muted} />
                </Pressable>
              </ScrollView>

              {formError && <Text style={styles.errorText}>{formError}</Text>}
            </ScrollView>

            <View style={styles.formActions}>
              <Pressable style={styles.formCancelButton} onPress={() => setAddVisible(false)}>
                <Text style={styles.formCancelLabel}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.formSubmitButton, !canSubmit && styles.formSubmitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit}>
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.formSubmitLabel}>{t('common.add')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function formatDate(iso: string, language: DateLanguage): string {
  return formatLocalizedIsoDate(iso, language);
}

const local = StyleSheet.create({
  photoDate: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.dark,
  },
  imageRow: {
    marginBottom: 14,
  },
  imageThumbWrap: {
    marginRight: 10,
  },
  imageThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Brand.greenMuted,
  },
  imageRemoveButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#C0392B',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
