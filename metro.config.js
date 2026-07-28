const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Global font override: redirect every resolution of the platform's real Text module to our
// wrapper, which applies the brand font by default. Native and web resolve 'react-native's Text
// to different underlying files, so each gets its own wrapper (components/patched-text.native.tsx,
// components/patched-text.web.tsx) and its own real-file target here. react-native-web ships both
// an ESM and a CJS build; which one Metro picks isn't guaranteed, so both are matched.
const nativeTextWrapper = path.resolve(__dirname, 'components/patched-text.native.tsx');
const webTextWrapper = path.resolve(__dirname, 'components/patched-text.web.tsx');

const redirects = new Map([
  [path.resolve(__dirname, 'node_modules/react-native/Libraries/Text/Text.js'), nativeTextWrapper],
  [path.resolve(__dirname, 'node_modules/react-native-web/dist/exports/Text/index.js'), webTextWrapper],
  [path.resolve(__dirname, 'node_modules/react-native-web/dist/cjs/exports/Text/index.js'), webTextWrapper],
]);
const wrapperPaths = new Set(redirects.values());

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolution = context.resolveRequest(context, moduleName, platform);

  if (resolution.type === 'sourceFile' && !wrapperPaths.has(context.originModulePath)) {
    const wrapper = redirects.get(resolution.filePath);
    if (wrapper) {
      return { type: 'sourceFile', filePath: wrapper };
    }
  }

  return resolution;
};

module.exports = config;
