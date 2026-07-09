import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Brand } from '@/constants/theme';

type Props = {
  /** Selected time as a 24-hour `HH:mm` string, or null when unset. */
  value: string | null;
  onChange: (value: string) => void;
  placeholder: string;
};

function toDate(value: string | null): Date {
  const date = new Date();
  if (!value) return date;
  const [hours, minutes] = value.split(':').map(Number);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

function toHhMm(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Native time field: shows the OS time picker on tap. The web build uses `time-field.web.tsx`
 * (a browser `<input type="time">`) instead — Metro resolves the platform variant automatically.
 */
export function TimeField({ value, onChange, placeholder }: Props) {
  const [show, setShow] = useState(false);

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    setShow(false);
    if (event.type === 'set' && date) {
      onChange(toHhMm(date));
    }
  }

  return (
    <>
      <Pressable style={styles.field} onPress={() => setShow(true)}>
        <Text style={[styles.text, { color: value ? Brand.dark : Brand.muted }]}>
          {value ? toDate(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : placeholder}
        </Text>
      </Pressable>
      {show && <DateTimePicker value={toDate(value)} mode="time" display="default" onChange={handleChange} />}
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
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
  },
});
