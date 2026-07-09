import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { styles as sharedStyles } from '@/components/farm/shared/styles';
import { DateField } from '@/components/ui/date-field';
import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { uploadProfileImage } from '@/services/auth-service';

const DANGER = '#DC2626';

type Tab = 'general' | 'private';

export default function ProfileScreen() {
  const { user, signOut, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [signingOut, setSigningOut] = useState(false);
  const [tab, setTab] = useState<Tab>('general');

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
  }, [user]);

  const fullName = [user?.name, user?.surname].filter(Boolean).join(' ') || user?.name || '';
  const initials = fullName
    .split(' ')
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleLabel = user?.role === 'Owner' ? t('profile.roleOwner') : t('profile.roleMember');

  const performSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      // On success the root navigator swaps back to the auth stack automatically.
      await signOut();
    } catch {
      setSigningOut(false);
      Alert.alert(t('profile.logout'), t('profile.logoutError'));
    }
  };

  const confirmSignOut = () => {
    // React Native's Alert ignores the buttons array on web, so its confirm callback
    // never fires there. Fall back to the browser's native confirm dialog.
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window === 'undefined' ||
        window.confirm(`${t('profile.logoutConfirmTitle')}\n\n${t('profile.logoutConfirmBody')}`);
      if (confirmed) {
        performSignOut();
      }
      return;
    }

    Alert.alert(t('profile.logoutConfirmTitle'), t('profile.logoutConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('profile.logout'), style: 'destructive', onPress: performSignOut },
    ]);
  };

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

      <View style={sharedStyles.tabRow}>
        <Pressable style={sharedStyles.tabItem} onPress={() => setTab('general')}>
          <Text style={[sharedStyles.tabLabel, tab === 'general' && sharedStyles.tabLabelActive]}>
            {t('profile.tabGeneral')}
          </Text>
          {tab === 'general' && <View style={sharedStyles.tabIndicator} />}
        </Pressable>
        <Pressable style={sharedStyles.tabItem} onPress={() => setTab('private')}>
          <Text style={[sharedStyles.tabLabel, tab === 'private' && sharedStyles.tabLabelActive]}>
            {t('profile.tabPrivate')}
          </Text>
          {tab === 'private' && <View style={sharedStyles.tabIndicator} />}
        </Pressable>
      </View>

      {tab === 'general' ? (
        <View style={styles.content}>
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
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="shield-checkmark-outline" size={13} color={Brand.green} />
              <Text style={styles.roleText}>{roleLabel}</Text>
            </View>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.formScroll} contentContainerStyle={sharedStyles.scrollContent}>
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
      )}

      <Pressable
        style={[styles.logoutButton, signingOut && styles.logoutButtonDisabled]}
        onPress={confirmSignOut}
        disabled={signingOut}>
        {signingOut ? (
          <ActivityIndicator color={DANGER} />
        ) : (
          <>
            <Ionicons name="log-out-outline" size={20} color={DANGER} />
            <Text style={styles.logoutText}>{t('profile.logout')}</Text>
          </>
        )}
      </Pressable>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
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
  },
  email: {
    fontSize: 14,
    color: Brand.muted,
    marginTop: 4,
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    marginHorizontal: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: DANGER,
  },
});
