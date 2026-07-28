import { forwardRef } from 'react';
import type { Text as RNText, TextProps } from 'react-native';

// Deep import (not `import { Text } from 'react-native'`) so metro.config.js can redirect every
// *other* resolution of this exact file to this wrapper, while this import itself still reaches
// the real component — see the resolver there for why the path must match verbatim.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RealText = require('react-native/Libraries/Text/Text').default as typeof RNText;

export const FONT_FAMILY = 'AlkRexBold';

/** Drop-in replacement for RN's Text that defaults every text node in the app to the brand font,
 * without touching each screen's styles. Local `fontFamily` in a style prop still wins. */
const PatchedText = forwardRef<RNText, TextProps>(({ style, ...props }, ref) => (
  <RealText ref={ref} {...props} style={[{ fontFamily: FONT_FAMILY }, style]} />
));

PatchedText.displayName = 'Text';

export default PatchedText;
