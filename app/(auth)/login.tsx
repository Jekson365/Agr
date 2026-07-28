import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LanguageToggle } from '@/components/ui/language-toggle';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';

type Mode = 'login' | 'register';

const DARK = Brand.dark;
const BORDER = Brand.border;
const MUTED = Brand.muted;
const BACKGROUND = Brand.background;
const DANGER = '#DC2626';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const { t } = useLanguage();
  const { height: windowHeight } = useWindowDimensions();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const logoRef = useRef<View>(null);
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;

  const playLoadingTransition = () => {
    setIsTransitioning(true);
    logoRef.current?.measureInWindow((_x, y, _width, height) => {
      const distanceToCenter = windowHeight / 2 - (y + height / 2);
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.timing(logoTranslateY, {
          toValue: distanceToCenter,
          duration: 550,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const revertLoadingTransition = () => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(() => setIsTransitioning(false));
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const validate = (): string | null => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password || (mode === 'register' && !name.trim())) {
      return t('auth.errorFillFields');
    }
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      return t('auth.errorInvalidEmail');
    }
    if (mode === 'register') {
      if (password.length < 6) {
        return t('auth.errorPasswordShort');
      }
      if (password !== confirmPassword) {
        return t('auth.errorPasswordMismatch');
      }
    }
    return null;
  };

  const messageForError = (err: unknown): string => {
    console.error('[login] request failed:', err);
    if (err instanceof ApiError) {
      if (err.status === 401) return t('auth.errorInvalidCredentials');
      if (err.status === 409) return t('auth.errorEmailExists');
    }
    return t('auth.errorGeneric');
  };

  const handleSubmit = async () => {
    if (submitting) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSubmitting(true);
    playLoadingTransition();
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
      } else {
        await signUp({ name: name.trim(), email: email.trim(), password });
      }
      // On success the root navigator swaps to the authenticated stack automatically,
      // picking up right where this screen's centered logo left off.
    } catch (err) {
      setError(messageForError(err));
      setSubmitting(false);
      revertLoadingTransition();
    }
  };

  const handleGoogleSignIn = () => {
    // TODO: wire up Google OAuth once the provider is configured.
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Image
        source={require('@/assets/farmland.png')}
        style={styles.backgroundImage}
        contentFit="cover"
      />
      <View style={styles.scrim} pointerEvents="none" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <Animated.View style={[styles.topBar, { opacity: contentOpacity }]} pointerEvents={isTransitioning ? 'none' : 'auto'}>
            <LanguageToggle />
          </Animated.View>

          <Animated.View
            ref={logoRef}
            style={[styles.logoContainer, { transform: [{ translateY: logoTranslateY }] }]}>
            <View style={styles.logoBadge}>
              <Image source={require('@/assets/logo.png')} style={styles.logoImage} contentFit="contain" />
            </View>
            <Text style={styles.appName}>{t('auth.appName')}</Text>
            <Text style={styles.appTagline}>{t('auth.tagline')}</Text>
            {isTransitioning && <ActivityIndicator color="#FFFFFF" style={styles.transitionSpinner} />}
          </Animated.View>

          <Animated.View
            style={[styles.card, { opacity: contentOpacity }]}
            pointerEvents={isTransitioning ? 'none' : 'auto'}>
            <View style={styles.tabRow}>
              <Pressable style={styles.tabItem} onPress={() => switchMode('login')}>
                <Text style={[styles.tabLabel, mode === 'login' && styles.tabLabelActive]}>
                  {t('auth.login')}
                </Text>
                {mode === 'login' && <View style={styles.tabIndicator} />}
              </Pressable>
              <Pressable style={styles.tabItem} onPress={() => switchMode('register')}>
                <Text style={[styles.tabLabel, mode === 'register' && styles.tabLabelActive]}>
                  {t('auth.register')}
                </Text>
                {mode === 'register' && <View style={styles.tabIndicator} />}
              </Pressable>
            </View>

            <View style={styles.form}>
              {mode === 'register' && (
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color={MUTED} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.fullName')}
                    placeholderTextColor={MUTED}
                    autoCapitalize="words"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              )}

              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color={MUTED} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.email')}
                  placeholderTextColor={MUTED}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={MUTED}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.password')}
                  placeholderTextColor={MUTED}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {mode === 'register' && (
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={MUTED}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.confirmPassword')}
                    placeholderTextColor={MUTED}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              )}

              {mode === 'login' && (
                <Pressable style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
                </Pressable>
              )}

              {error && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={16} color={DANGER} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Pressable
                style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {mode === 'login' ? t('auth.login') : t('auth.register')}
                  </Text>
                )}
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>{t('auth.or')}</Text>
                <View style={styles.dividerLine} />
              </View>

              <Pressable style={styles.googleButton} onPress={handleGoogleSignIn}>
                <AntDesign name="google" size={18} color={DARK} />
                <Text style={styles.googleButtonText}>{t('auth.continueWithGoogle')}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(31, 42, 36, 0.18)',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 24,
  },
  topBar: {
    position: 'absolute',
    top: 16,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
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
  transitionSpinner: {
    marginTop: 20,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 12,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: MUTED,
  },
  tabLabelActive: {
    color: DARK,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    height: 2,
    width: '60%',
    backgroundColor: DARK,
    borderRadius: 1,
  },
  form: {
    gap: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: DARK,
    height: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 13,
    color: MUTED,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: DANGER,
  },
  submitButton: {
    backgroundColor: DARK,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },
  dividerText: {
    fontSize: 12,
    color: MUTED,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    height: 52,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK,
  },
});
