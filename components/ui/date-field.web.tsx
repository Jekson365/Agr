import { type CSSProperties } from 'react';

import { toIsoDate } from '@/components/ui/date-utils';
import { Brand } from '@/constants/theme';

type Props = {
  /** Selected date as a `YYYY-MM-DD` string, or null when unset. */
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
  maximumDate?: Date;
};

/** Web date field backed by a browser-native `<input type="date">`. */
export function DateField({ value, onChange, maximumDate }: Props) {
  return (
    <input
      type="date"
      value={value ?? ''}
      max={maximumDate ? toIsoDate(maximumDate) : undefined}
      onChange={(event) => onChange(event.target.value ? event.target.value : null)}
      style={inputStyle}
    />
  );
}

const inputStyle: CSSProperties = {
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: Brand.border,
  borderRadius: 12,
  paddingLeft: 14,
  paddingRight: 14,
  paddingTop: 10,
  paddingBottom: 10,
  fontSize: 15,
  color: Brand.dark,
  marginBottom: 14,
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: 'transparent',
  fontFamily: 'inherit',
};
