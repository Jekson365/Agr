import { Pressable, StyleSheet, Text } from 'react-native';

import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';

export function LanguageToggle() {
  const { languageLabel, toggleLanguage } = useLanguage();

  return (
    <Pressable
      style={styles.button}
      onPress={toggleLanguage}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Change language">
      <Text style={styles.label}>{languageLabel}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 38,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.greenMuted,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.green,
  },
});
