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
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { createEquipment, updateEquipment, uploadEquipmentImage } from '@/services/equipment-service';
import type { Equipment } from '@/types/equipment';

type Props = {
  visible: boolean;
  editingItem: Equipment | null;
  onClose: () => void;
  onSaved: (item: Equipment, isNew: boolean) => void;
  onDelete: (item: Equipment) => void;
};

export function EquipmentFormModal({ visible, editingItem, onClose, onSaved, onDelete }: Props) {
  const { t } = useLanguage();

  const [nameInput, setNameInput] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImagePath, setExistingImagePath] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = editingItem != null;

  // Initialize the form fields whenever the modal is opened.
  useEffect(() => {
    if (!visible) return;
    setFormError(null);
    setImageUri(null);
    setNameInput(editingItem?.name ?? '');
    setQuantityInput(editingItem ? String(editingItem.quantity) : '');
    setExistingImagePath(editingItem?.imagePath ?? '');
  }, [visible, editingItem]);

  async function pickImage() {
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

    setSaving(true);
    setFormError(null);
    try {
      const quantity = Math.max(0, parseInt(quantityInput, 10) || 0);
      const imagePath = imageUri ? await uploadEquipmentImage(imageUri) : existingImagePath;

      if (isEditing) {
        const updated: Equipment = { id: editingItem!.id, name: trimmedName, quantity, imagePath };
        await updateEquipment(updated.id, updated);
        onSaved(updated, false);
      } else {
        const created = await createEquipment({ name: trimmedName, quantity, imagePath });
        onSaved(created, true);
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
          <Text style={styles.formTitle}>{isEditing ? t('equipment.edit') : t('equipment.add')}</Text>

          <Text style={styles.fieldLabel}>{t('equipment.name')}</Text>
          <TextInput
            style={styles.input}
            value={nameInput}
            onChangeText={setNameInput}
            placeholder={t('equipment.namePlaceholder')}
            placeholderTextColor={Brand.muted}
          />

          <Text style={styles.fieldLabel}>{t('equipment.quantity')}</Text>
          <TextInput
            style={styles.input}
            value={quantityInput}
            onChangeText={setQuantityInput}
            placeholder={t('equipment.quantityPlaceholder')}
            placeholderTextColor={Brand.muted}
            keyboardType="number-pad"
          />

          <Text style={styles.fieldLabel}>{t('equipment.image')}</Text>
          <Pressable style={styles.imagePicker} onPress={pickImage}>
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

          {isEditing && (
            <Pressable style={styles.formDeleteButton} onPress={() => onDelete(editingItem!)}>
              <Ionicons name="trash-outline" size={16} color="#C0392B" />
              <Text style={styles.formDeleteLabel}>{t('common.delete')}</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
