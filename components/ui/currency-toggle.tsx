import { Pressable, StyleSheet, Text } from 'react-native';

import { Brand } from '@/constants/theme';
import { useCurrency } from '@/contexts/currency-context';

export function CurrencyToggle() {
  const { currency, toggleCurrency } = useCurrency();

  return (
    <Pressable
      style={styles.button}
      onPress={toggleCurrency}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Change currency">
      <Text style={styles.label}>{currency}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 46,
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
