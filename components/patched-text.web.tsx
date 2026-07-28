import { forwardRef } from 'react';
import type { Text as RNText, TextProps } from 'react-native';

// Deep import (not `import { Text } from 'react-native-web'`) so metro.config.js can redirect
// every *other* resolution of this exact file to this wrapper, while this import itself still
// reaches the real component — see the resolver there for why the path must match verbatim.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RealText = require('react-native-web/dist/exports/Text').default as typeof RNText;

export const FONT_FAMILY = 'AlkRexBold';

/** Web counterpart of patched-text.native.tsx — same brand-font default, wrapping
 * react-native-web's Text instead of bare RN's. */
const PatchedText = forwardRef<RNText, TextProps>(({ style, ...props }, ref) => (
  <RealText ref={ref} {...props} style={[{ fontFamily: FONT_FAMILY }, style]} />
));

PatchedText.displayName = 'Text';

export default PatchedText;
