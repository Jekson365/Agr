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
  TextInput,
  View,
} from 'react-native';

import { styles } from '@/components/farm/shared/styles';
import { LISTING_TYPE_OPTIONS } from '@/components/market/market-listing';
import { SelectField } from '@/components/ui/select-field';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import {
  createMarketListing,
  updateMarketListing,
  uploadMarketListingImage,
} from '@/services/market-listing-service';
import type { ListingType, MarketListing } from '@/types/market-listing';

type Props = {
  visible: boolean;
  editingListing: MarketListing | null;
  onClose: () => void;
  onSaved: (listing: MarketListing, isNew: boolean) => void;
};

export function ListingFormModal({ visible, editingListing, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [listingType, setListingType] = useState<ListingType>('Sale');
  const [titleInput, setTitleInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [priceUnitInput, setPriceUnitInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [newImageUris, setNewImageUris] = useState<string[]>([]);
  const [existingImagePaths, setExistingImagePaths] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingListing != null;

  // Initialize the fields whenever opened.
  useEffect(() => {
    if (!visible) return;
    setListingType(editingListing?.type ?? 'Sale');
    setTitleInput(editingListing?.title ?? '');
    setDescriptionInput(editingListing?.description ?? '');
    setPriceInput(editingListing ? String(editingListing.price) : '');
    setPriceUnitInput(editingListing?.priceUnit ?? '');
    setQuantityInput(editingListing?.quantity != null ? String(editingListing.quantity) : '');
    setLocationInput(editingListing?.location ?? '');
    setNewImageUris([]);
    setExistingImagePaths(editingListing?.imagePaths ?? []);
    setFormError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, editingListing]);

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
      setNewImageUris((prev) => [...prev, ...result.assets.map((asset) => asset.uri)]);
    }
  }

  function removeExistingImage(path: string) {
    setExistingImagePaths((prev) => prev.filter((p) => p !== path));
  }

  function removeNewImage(uri: string) {
    setNewImageUris((prev) => prev.filter((u) => u !== uri));
  }

  const trimmedTitle = titleInput.trim();
  const price = Math.max(0, parseFloat(priceInput) || 0);
  const quantity = quantityInput.trim() === '' ? null : Math.max(0, parseFloat(quantityInput) || 0);

  const canSubmit = price > 0 && trimmedTitle !== '' && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;

    setSaving(true);
    setFormError(null);
    try {
      const uploadedPaths = await Promise.all(newImageUris.map((uri) => uploadMarketListingImage(uri)));
      const imagePaths = [...existingImagePaths, ...uploadedPaths];
      const payload = {
        type: listingType,
        category: editingListing?.category ?? 'Other',
        itemType: editingListing?.itemType ?? '',
        title: trimmedTitle,
        description: descriptionInput.trim() || null,
        price,
        priceUnit: priceUnitInput.trim(),
        quantity,
        location: locationInput.trim(),
        imagePaths,
      };

      if (isEditing) {
        const updated: MarketListing = { ...editingListing, ...payload };
        await updateMarketListing(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createMarketListing(payload);
        onSaved(created, true);
      }
      onClose();
    } catch {
      setFormError(t('market.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.formOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{isEditing ? t('market.edit') : t('market.add')}</Text>

          <ScrollView style={styles.formScrollArea}>
            <Text style={styles.fieldLabel}>{t('market.listingTypeLabel')}</Text>
            <SelectField
              options={LISTING_TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: t(opt.labelKey) }))}
              selected={listingType}
              onSelect={setListingType}
            />

            <Text style={styles.fieldLabel}>{t('market.titleLabel')}</Text>
            <TextInput
              style={styles.input}
              value={titleInput}
              onChangeText={setTitleInput}
              placeholder={t('market.titlePlaceholder')}
              placeholderTextColor={Brand.muted}
            />

            <Text style={styles.fieldLabel}>{t('market.description')}</Text>
            <TextInput
              style={[styles.input, local.multiline]}
              value={descriptionInput}
              onChangeText={setDescriptionInput}
              placeholder={t('market.descriptionPlaceholder')}
              placeholderTextColor={Brand.muted}
              multiline
              numberOfLines={3}
            />

            <View style={styles.formRow}>
              <View style={styles.formRowField}>
                <Text style={styles.fieldLabel}>{t('market.price')}</Text>
                <TextInput
                  style={styles.input}
                  value={priceInput}
                  onChangeText={setPriceInput}
                  placeholder={t('market.pricePlaceholder')}
                  placeholderTextColor={Brand.muted}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={styles.formRowField}>
                <Text style={styles.fieldLabel}>{t('market.priceUnit')}</Text>
                <TextInput
                  style={styles.input}
                  value={priceUnitInput}
                  onChangeText={setPriceUnitInput}
                  placeholder={t('market.priceUnitPlaceholder')}
                  placeholderTextColor={Brand.muted}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>{t('market.quantity')}</Text>
            <TextInput
              style={styles.input}
              value={quantityInput}
              onChangeText={setQuantityInput}
              placeholder={t('market.quantityPlaceholder')}
              placeholderTextColor={Brand.muted}
              keyboardType="decimal-pad"
            />

            <Text style={styles.fieldLabel}>{t('market.location')}</Text>
            <TextInput
              style={styles.input}
              value={locationInput}
              onChangeText={setLocationInput}
              placeholder={t('market.locationPlaceholder')}
              placeholderTextColor={Brand.muted}
            />

            <Text style={styles.fieldLabel}>{t('market.image')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={local.imageRow}>
              {existingImagePaths.map((path) => (
                <View key={path} style={local.imageThumbWrap}>
                  <Image source={{ uri: resolveAssetUrl(path) }} style={local.imageThumb} contentFit="cover" />
                  <Pressable
                    style={local.imageRemoveButton}
                    hitSlop={8}
                    onPress={() => removeExistingImage(path)}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.delete')}>
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
              {newImageUris.map((uri) => (
                <View key={uri} style={local.imageThumbWrap}>
                  <Image source={{ uri }} style={local.imageThumb} contentFit="cover" />
                  <Pressable
                    style={local.imageRemoveButton}
                    hitSlop={8}
                    onPress={() => removeNewImage(uri)}
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
            <Pressable style={styles.formCancelButton} onPress={onClose}>
              <Text style={styles.formCancelLabel}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[styles.formSubmitButton, !canSubmit && styles.formSubmitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.formSubmitLabel}>{isEditing ? t('common.save') : t('common.add')}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const local = StyleSheet.create({
  multiline: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 10,
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
