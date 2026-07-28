import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { formatLocalizedDate, parseIsoDate, toIsoDate } from '@/components/ui/date-utils';
import { Brand } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';

type Props = {
  /** Selected date as a `YYYY-MM-DD` string, or null when unset. */
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
  maximumDate?: Date;
};

/**
 * Native date field: shows the OS date picker on tap. The web build uses `date-field.web.tsx`
 * (a browser `<input type="date">`) instead — Metro resolves the platform variant automatically.
 */
export function DateField({ value, onChange, placeholder, maximumDate }: Props) {
  const { language } = useLanguage();
  const [show, setShow] = useState(false);
  const selected = parseIsoDate(value);

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    setShow(false);
    if (event.type === 'set' && date) {
      onChange(toIsoDate(date));
    }
  }

  return (
    <>
      <Pressable style={styles.field} onPress={() => setShow(true)}>
        <Text style={[styles.text, { color: selected ? Brand.dark : Brand.muted }]}>
          {selected ? formatLocalizedDate(selected, language) : placeholder}
        </Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={selected ?? maximumDate ?? new Date()}
          mode="date"
          display="default"
          maximumDate={maximumDate}
          onChange={handleChange}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
  },
});
