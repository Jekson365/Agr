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
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { LIVESTOCK_KIND_IMAGE, LIVESTOCK_KIND_OPTIONS, type Tab } from '@/components/farm/livestock/livestock';
import { styles } from '@/components/farm/shared/styles';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { createFarm, updateFarm, uploadFarmImage } from '@/services/farm-service';
import { createLivestock, updateLivestock } from '@/services/livestock-service';
import type { Farm } from '@/types/farm';
import type { AnimalType, Livestock } from '@/types/livestock';

type Props = {
  visible: boolean;
  type: Tab;
  editingItem: Livestock | Farm | null;
  farms: Farm[];
  onClose: () => void;
  onLivestockSaved: (item: Livestock, isNew: boolean) => void;
  onLandSaved: (farm: Farm, isNew: boolean) => void;
};

export function FarmFormModal({
  visible,
  type,
  editingItem,
  farms,
  onClose,
  onLivestockSaved,
  onLandSaved,
}: Props) {
  const { t } = useLanguage();

  const [nameInput, setNameInput] = useState('');
  const [countInput, setCountInput] = useState('');
  const [areaInput, setAreaInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [livestockType, setLivestockType] = useState<AnimalType>('Cow');
  const [farmId, setFarmId] = useState<number | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImagePath, setExistingImagePath] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingItem != null;
  const noFarmSelected = type === 'livestock' && farmId == null;

  // Initialize the form fields whenever the modal is opened.
  useEffect(() => {
    if (!visible) return;
    setFormError(null);
    setImageUri(null);
    if (type === 'livestock') {
      const item = editingItem as Livestock | null;
      setNameInput(item?.name ?? '');
      setCountInput(item ? String(item.count) : '');
      setLivestockType(item?.type ?? 'Cow');
      setFarmId(item?.farmId ?? farms[0]?.id ?? null);
      setExistingImagePath('');
    } else {
      const item = editingItem as Farm | null;
      setNameInput(item?.name ?? '');
      setAreaInput(item ? String(item.area) : '');
      setLocationInput(item?.location ?? '');
      setExistingImagePath(item?.imagePath ?? '');
    }
  }, [visible, editingItem, type, farms]);

  async function pickLandImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError(t('farm.imagePermissionDenied'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    const trimmedName = nameInput.trim();
    if (!trimmedName) return;
    if (type === 'livestock' && farmId == null) return;

    setSaving(true);
    setFormError(null);
    try {
      if (type === 'livestock') {
        const count = Math.max(0, parseInt(countInput, 10) || 0);
        if (isEditing) {
          const updated: Livestock = { id: editingItem!.id as number, type: livestockType, count, name: trimmedName, farmId: farmId! };
          await updateLivestock(updated.id, updated);
          onLivestockSaved(updated, false);
        } else {
          const created = await createLivestock({ type: livestockType, count, name: trimmedName, farmId: farmId! });
          onLivestockSaved(created, true);
        }
      } else {
        const area = Math.max(0, parseFloat(areaInput) || 0);
        const location = locationInput.trim();
        const imagePath = imageUri ? await uploadFarmImage(imageUri) : existingImagePath;

        if (isEditing) {
          const updated: Farm = { id: editingItem!.id as number, name: trimmedName, imagePath, area, location };
          await updateFarm(updated.id, updated);
          onLandSaved(updated, false);
        } else {
          const created = await createFarm({ name: trimmedName, imagePath, area, location });
          onLandSaved(created, true);
        }
      }
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.formOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {type === 'livestock'
              ? isEditing
                ? t('farm.editLivestock')
                : t('farm.addLivestock')
              : isEditing
                ? t('farm.editFarmland')
                : t('farm.addFarmland')}
          </Text>

          <Text style={styles.fieldLabel}>{t('farm.name')}</Text>
          <TextInput
            style={styles.input}
            value={nameInput}
            onChangeText={setNameInput}
            placeholder={type === 'livestock' ? t('farm.namePlaceholderLivestock') : t('farm.namePlaceholderLand')}
            placeholderTextColor={Brand.muted}
          />

          {type === 'livestock' ? (
            <>
              <Text style={styles.fieldLabel}>{t('farm.type')}</Text>
              <View style={styles.kindRow}>
                {LIVESTOCK_KIND_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={[styles.kindChip, livestockType === opt.value && styles.kindChipActive]}
                    onPress={() => setLivestockType(opt.value)}>
                    <Image source={LIVESTOCK_KIND_IMAGE[opt.value]} style={styles.kindChipIcon} contentFit="contain" />
                    <Text style={[styles.kindChipLabel, livestockType === opt.value && styles.kindChipLabelActive]}>
                      {t(opt.labelKey)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.fieldLabel}>{t('farm.count')}</Text>
              <TextInput
                style={styles.input}
                value={countInput}
                onChangeText={setCountInput}
                placeholder={t('farm.countPlaceholder')}
                placeholderTextColor={Brand.muted}
                keyboardType="number-pad"
              />

              <Text style={styles.fieldLabel}>{t('farm.farmland')}</Text>
              {farms.length === 0 ? (
                <Text style={styles.emptyHint}>{t('farm.noFarmland')}</Text>
              ) : (
                <View style={styles.kindRow}>
                  {farms.map((f) => (
                    <Pressable
                      key={f.id}
                      style={[styles.kindChip, farmId === f.id && styles.kindChipActive]}
                      onPress={() => setFarmId(f.id)}>
                      <Text style={[styles.kindChipLabel, farmId === f.id && styles.kindChipLabelActive]}>
                        {f.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          ) : (
            <>
              <Text style={styles.fieldLabel}>{t('farm.area')}</Text>
              <TextInput
                style={styles.input}
                value={areaInput}
                onChangeText={setAreaInput}
                placeholder={t('farm.areaPlaceholder')}
                placeholderTextColor={Brand.muted}
                keyboardType="decimal-pad"
              />

              <Text style={styles.fieldLabel}>{t('farm.location')}</Text>
              <TextInput
                style={styles.input}
                value={locationInput}
                onChangeText={setLocationInput}
                placeholder={t('farm.locationPlaceholder')}
                placeholderTextColor={Brand.muted}
              />

              <Text style={styles.fieldLabel}>{t('farm.image')}</Text>
              <Pressable style={styles.imagePicker} onPress={pickLandImage}>
                {imageUri || existingImagePath ? (
                  <Image
                    source={{ uri: imageUri ?? resolveAssetUrl(existingImagePath) }}
                    style={styles.imagePickerPreview}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <Ionicons name="image-outline" size={24} color={Brand.muted} />
                  </View>
                )}
                <Text style={styles.imagePickerLabel}>
                  {imageUri || existingImagePath ? t('farm.changeImage') : t('farm.chooseImage')}
                </Text>
              </Pressable>
            </>
          )}

          {formError && <Text style={styles.errorText}>{t('farm.saveError')}</Text>}

          <View style={styles.formActions}>
            <Pressable style={styles.formCancelButton} onPress={onClose}>
              <Text style={styles.formCancelLabel}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[styles.formSubmitButton, (saving || noFarmSelected) && styles.formSubmitButtonDisabled]}
              onPress={handleSubmit}
              disabled={saving || noFarmSelected}>
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
