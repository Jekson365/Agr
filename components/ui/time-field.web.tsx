import { type CSSProperties } from 'react';

import { Brand } from '@/constants/theme';

type Props = {
  /** Selected time as a 24-hour `HH:mm` string, or null when unset. */
  value: string | null;
  onChange: (value: string) => void;
  placeholder: string;
};

/** Web time field backed by a browser-native `<input type="time">`. */
export function TimeField({ value, onChange }: Props) {
  return (
    <input
      type="time"
      value={value ?? ''}
      onChange={(event) => event.target.value && onChange(event.target.value)}
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
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: 'transparent',
  fontFamily: 'inherit',
};
