import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles as sharedStyles } from '@/components/farm/shared/styles';
import { DateField } from '@/components/ui/date-field';
import { formatBytes } from '@/components/ui/format-bytes';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { uploadProfileImage } from '@/services/auth-service';
import type { StoragePlan } from '@/types/auth';

const STORAGE_PLAN_LABEL_KEY: Record<StoragePlan, string> = {
  Free: 'profile.planFree',
  Medium: 'profile.planMedium',
  Premium: 'profile.planPremium',
};

function countLabel(max: number | null, t: (key: string) => string): string {
  return max == null ? t('profile.limitUnlimited') : String(max);
}

export default function ProfileScreen() {
  const { user, updateProfile, refreshUser } = useAuth();
  const { t } = useLanguage();

  // Storage usage changes whenever an image is uploaded anywhere in the app (stock photos,
  // equipment, livestock, listings...), so re-fetch the current user each time this screen
  // is focused rather than relying on the possibly-stale cached session user.
  useFocusEffect(
    useCallback(() => {
      refreshUser().catch(() => {});
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const [nameInput, setNameInput] = useState('');
  const [surnameInput, setSurnameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [countryInput, setCountryInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [existingImagePath, setExistingImagePath] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setNameInput(user?.name ?? '');
    setSurnameInput(user?.surname ?? '');
    setPhoneInput(user?.phoneNumber ?? '');
    setCountryInput(user?.country ?? '');
    setCityInput(user?.city ?? '');
    setBirthDate(user?.birthDate ?? null);
    setImageUri(null);
    setExistingImagePath(user?.imagePath ?? '');
    // Only re-sync form fields when the logged-in user actually changes, not on every
    // background refreshUser() (e.g. from useFocusEffect above) — otherwise an in-progress
    // edit gets silently overwritten each time this screen regains focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fullName = [user?.name, user?.surname].filter(Boolean).join(' ') || user?.name || '';
  const initials = fullName
    .split(' ')
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleLabel = user?.role === 'Owner' ? t('profile.roleOwner') : t('profile.roleMember');

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

  async function handleSaveProfile() {
    if (saving) return;
    setSaving(true);
    setFormError(null);
    try {
      const imagePath = imageUri ? await uploadProfileImage(imageUri) : existingImagePath;
      await updateProfile({
        name: nameInput.trim(),
        surname: surnameInput.trim(),
        phoneNumber: phoneInput.trim(),
        country: countryInput.trim(),
        city: cityInput.trim(),
        birthDate,
        imagePath,
      });
    } catch {
      setFormError(t('profile.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <LanguageToggle />
      </View>

      <ScrollView style={styles.formScroll} contentContainerStyle={sharedStyles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            {user?.imagePath ? (
              <Image source={{ uri: resolveAssetUrl(user.imagePath) }} style={styles.avatarImage} contentFit="cover" />
            ) : initials ? (
              <Text style={styles.avatarText}>{initials}</Text>
            ) : (
              <Ionicons name="person-outline" size={28} color={Brand.green} />
            )}
          </View>
          <Text style={styles.name}>{fullName || user?.name}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="shield-checkmark-outline" size={13} color={Brand.green} />
            <Text style={styles.roleText}>{roleLabel}</Text>
          </View>

          {user ? (
            <View style={styles.storageSection}>
              <View style={styles.storageHeaderRow}>
                <View style={styles.planBadge}>
                  <Ionicons name="cloud-outline" size={13} color={Brand.green} />
                  <Text style={styles.planText}>{t(STORAGE_PLAN_LABEL_KEY[user.plan] ?? STORAGE_PLAN_LABEL_KEY.Free)}</Text>
                </View>
                <Text style={styles.storageText}>
                  {user.storageLimitBytes == null
                    ? t('profile.storageUsedUnlimited', { used: formatBytes(user.storageUsedBytes) })
                    : t('profile.storageUsed', {
                        used: formatBytes(user.storageUsedBytes),
                        limit: formatBytes(user.storageLimitBytes),
                      })}
                </Text>
              </View>
              {user.storageLimitBytes != null ? (
                <View style={styles.storageBarTrack}>
                  <View
                    style={[
                      styles.storageBarFill,
                      { width: `${Math.min(100, (user.storageUsedBytes / user.storageLimitBytes) * 100)}%` },
                    ]}
                  />
                </View>
              ) : null}

              <Text style={styles.limitsTitle}>{t('profile.planLimitsTitle')}</Text>
              {[
                { label: t('profile.limitLand'), value: countLabel(user.maxLand, t), muted: false },
                { label: t('profile.limitLivestock'), value: countLabel(user.maxLivestockKinds, t), muted: false },
                { label: t('profile.limitStock'), value: countLabel(user.maxStockKinds, t), muted: false },
                { label: t('profile.limitFruit'), value: countLabel(user.maxFruitKinds, t), muted: false },
                {
                  label: t('profile.limitBalance'),
                  value: t(user.balanceAllowed ? 'profile.limitIncluded' : 'profile.limitNotIncluded'),
                  muted: !user.balanceAllowed,
                },
                {
                  label: t('profile.limitEquipment'),
                  value: t(user.equipmentAllowed ? 'profile.limitIncluded' : 'profile.limitNotIncluded'),
                  muted: !user.equipmentAllowed,
                },
              ].map((row) => (
                <View key={row.label} style={styles.limitRow}>
                  <Text style={styles.limitLabel}>{row.label}</Text>
                  <Text style={[styles.limitValue, row.muted && styles.limitValueMuted]}>{row.value}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <Text style={sharedStyles.fieldLabel}>{t('profile.image')}</Text>
        <Pressable style={sharedStyles.imagePicker} onPress={pickImage}>
          {imageUri || existingImagePath ? (
            <Image
              source={{ uri: imageUri ?? resolveAssetUrl(existingImagePath) }}
              style={sharedStyles.imagePickerPreview}
              contentFit="cover"
            />
          ) : (
            <View style={sharedStyles.imagePickerPlaceholder}>
              <Ionicons name="person-outline" size={24} color={Brand.muted} />
            </View>
          )}
          <Text style={sharedStyles.imagePickerLabel}>
            {imageUri || existingImagePath ? t('farm.changeImage') : t('farm.chooseImage')}
          </Text>
        </Pressable>

        <Text style={sharedStyles.fieldLabel}>{t('profile.name')}</Text>
        <TextInput
          style={sharedStyles.input}
          value={nameInput}
          onChangeText={setNameInput}
          placeholder={t('profile.namePlaceholder')}
          placeholderTextColor={Brand.muted}
        />

        <Text style={sharedStyles.fieldLabel}>{t('profile.surname')}</Text>
        <TextInput
          style={sharedStyles.input}
          value={surnameInput}
          onChangeText={setSurnameInput}
          placeholder={t('profile.surnamePlaceholder')}
          placeholderTextColor={Brand.muted}
        />

        <Text style={sharedStyles.fieldLabel}>{t('profile.phoneNumber')}</Text>
        <TextInput
          style={sharedStyles.input}
          value={phoneInput}
          onChangeText={setPhoneInput}
          placeholder={t('profile.phoneNumberPlaceholder')}
          placeholderTextColor={Brand.muted}
          keyboardType="phone-pad"
        />

        <View style={sharedStyles.formRow}>
          <View style={sharedStyles.formRowField}>
            <Text style={sharedStyles.fieldLabel}>{t('profile.country')}</Text>
            <TextInput
              style={sharedStyles.input}
              value={countryInput}
              onChangeText={setCountryInput}
              placeholder={t('profile.countryPlaceholder')}
              placeholderTextColor={Brand.muted}
            />
          </View>
          <View style={sharedStyles.formRowField}>
            <Text style={sharedStyles.fieldLabel}>{t('profile.city')}</Text>
            <TextInput
              style={sharedStyles.input}
              value={cityInput}
              onChangeText={setCityInput}
              placeholder={t('profile.cityPlaceholder')}
              placeholderTextColor={Brand.muted}
            />
          </View>
        </View>

        <Text style={sharedStyles.fieldLabel}>{t('profile.birthDate')}</Text>
        <DateField
          value={birthDate}
          onChange={setBirthDate}
          placeholder={t('profile.birthDatePlaceholder')}
          maximumDate={new Date()}
        />

        <Text style={sharedStyles.fieldLabel}>{t('profile.location')}</Text>
        <Pressable style={styles.locationField} onPress={() => router.push('/profile-location')}>
          <Ionicons name="location-outline" size={18} color={Brand.green} />
          <Text style={styles.locationText}>
            {user?.latitude != null && user?.longitude != null
              ? `${user.latitude.toFixed(5)}, ${user.longitude.toFixed(5)}`
              : t('profile.locationNotSet')}
          </Text>
          <Text style={styles.locationAction}>
            {user?.latitude != null && user?.longitude != null
              ? t('profile.changeLocation')
              : t('profile.setLocation')}
          </Text>
        </Pressable>

        {formError && <Text style={sharedStyles.errorText}>{formError}</Text>}

        <Pressable
          style={[sharedStyles.formSubmitButton, saving && sharedStyles.formSubmitButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={sharedStyles.formSubmitLabel}>{t('common.save')}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Brand.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Brand.dark,
  },
  formScroll: {
    flex: 1,
  },
  card: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Brand.greenMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: Brand.green,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Brand.dark,
    marginBottom: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Brand.greenMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 16,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.green,
  },
  storageSection: {
    width: '100%',
    marginTop: 16,
  },
  storageHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Brand.greenMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  planText: {
    fontSize: 12,
    fontWeight: '600',
    color: Brand.green,
  },
  storageText: {
    fontSize: 12,
    color: Brand.muted,
  },
  storageBarTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: Brand.greenMuted,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Brand.green,
  },
  limitsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 16,
    marginBottom: 8,
  },
  limitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: Brand.border,
  },
  limitLabel: {
    fontSize: 13,
    color: Brand.dark,
  },
  limitValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.green,
  },
  limitValueMuted: {
    color: Brand.muted,
    fontWeight: '400',
  },
  locationField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: Brand.dark,
  },
  locationAction: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.green,
  },
});
