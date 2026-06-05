// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // React Three Fiber exposes three.js objects as lowercase JSX intrinsics
    // (mesh, sphereGeometry, meshStandardMaterial, ...). ESLint's DOM-oriented
    // rule doesn't know about them, so we disable it for the 3D components.
    files: ['components/mentio/**/*.tsx'],
    rules: {
      'react/no-unknown-property': 'off',
    },
  },
  {
    ignores: ['dist/*'],
  },
]);
