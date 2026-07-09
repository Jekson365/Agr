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

import { styles } from '@/components/farm/shared/styles';
import { DateField } from '@/components/ui/date-field';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import {
  createLivestockDetail,
  updateLivestockDetail,
  uploadLivestockDetailImage,
} from '@/services/livestock-detail-service';
import type { Gender, LivestockDetail } from '@/types/livestock-detail';

const GENDER_OPTIONS: { value: Gender; labelKey: string }[] = [
  { value: 'Male', labelKey: 'livestockDetail.male' },
  { value: 'Female', labelKey: 'livestockDetail.female' },
];

type Props = {
  visible: boolean;
  livestockId: number;
  editingDetail: LivestockDetail | null;
  onClose: () => void;
  onSaved: (detail: LivestockDetail, isNew: boolean) => void;
};

export function LivestockDetailFormModal({ visible, livestockId, editingDetail, onClose, onSaved }: Props) {
  const { t } = useLanguage();

  const [codeInput, setCodeInput] = useState('');
  const [bornDate, setBornDate] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImagePath, setExistingImagePath] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingDetail != null;

  // Initialize the fields whenever the modal is opened.
  useEffect(() => {
    if (!visible) return;
    setCodeInput(editingDetail?.code ?? '');
    setBornDate(editingDetail?.bornDate ?? null);
    setGender(editingDetail?.gender ?? null);
    setExistingImagePath(editingDetail?.imagePath ?? '');
    setImageUri(null);
    setFormError(null);
  }, [visible, editingDetail]);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError(t('farm.imagePermissionDenied'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    const trimmedCode = codeInput.trim();
    if (!trimmedCode) return;

    setSaving(true);
    setFormError(null);
    try {
      const imagePath = imageUri ? await uploadLivestockDetailImage(imageUri) : existingImagePath;

      if (isEditing) {
        const updated: LivestockDetail = { ...editingDetail, code: trimmedCode, imagePath, bornDate, gender };
        await updateLivestockDetail(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createLivestockDetail({ livestockId, code: trimmedCode, imagePath, bornDate, gender });
        onSaved(created, true);
      }
      onClose();
    } catch {
      setFormError(t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  const previewUri = imageUri ?? (existingImagePath ? resolveAssetUrl(existingImagePath) : null);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.formOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {isEditing ? t('livestockDetail.edit') : t('livestockDetail.add')}
          </Text>

          <Text style={styles.fieldLabel}>{t('livestockDetail.code')}</Text>
          <TextInput
            style={styles.input}
            value={codeInput}
            onChangeText={setCodeInput}
            placeholder={t('livestockDetail.codePlaceholder')}
            placeholderTextColor={Brand.muted}
            autoCapitalize="characters"
          />

          <Text style={styles.fieldLabel}>{t('livestockDetail.bornDate')}</Text>
          <DateField
            value={bornDate}
            onChange={setBornDate}
            placeholder={t('livestockDetail.bornDatePlaceholder')}
            maximumDate={new Date()}
          />

          <Text style={styles.fieldLabel}>{t('livestockDetail.gender')}</Text>
          <View style={styles.kindRow}>
            {GENDER_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                style={[styles.kindChip, gender === opt.value && styles.kindChipActive]}
                onPress={() => setGender(gender === opt.value ? null : opt.value)}>
                <Text style={[styles.kindChipLabel, gender === opt.value && styles.kindChipLabelActive]}>
                  {t(opt.labelKey)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.fieldLabel}>{t('farm.image')}</Text>
          <Pressable style={styles.imagePicker} onPress={pickImage}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.imagePickerPreview} contentFit="cover" />
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <Ionicons name="image-outline" size={24} color={Brand.muted} />
              </View>
            )}
            <Text style={styles.imagePickerLabel}>
              {previewUri ? t('farm.changeImage') : t('farm.chooseImage')}
            </Text>
          </Pressable>

          {formError && <Text style={styles.errorText}>{formError}</Text>}

          <View style={styles.formActions}>
            <Pressable style={styles.formCancelButton} onPress={onClose}>
              <Text style={styles.formCancelLabel}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              style={[styles.formSubmitButton, saving && styles.formSubmitButtonDisabled]}
              onPress={handleSubmit}
              disabled={saving}>
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
