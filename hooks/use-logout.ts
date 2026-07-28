import { useState } from 'react';
import { Alert, Platform } from 'react-native';

import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';

/** Confirms and performs sign-out, with the web/native dialog split the profile screen needs
 * (RN's Alert ignores its buttons array on web, so that platform falls back to window.confirm). */
export function useLogout() {
  const { signOut } = useAuth();
  const { t } = useLanguage();
  const [signingOut, setSigningOut] = useState(false);

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

  return { confirmSignOut, signingOut };
}
