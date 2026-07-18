import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Unit tests cover PURE logic only (api envelope, i18n resolution, RTL
// decision, trust taxonomy, saved reducer, prayer/number formatting). These
// files never import react-native or expo-*, so they run in a plain Node env
// with no native mocking. Screens/adapters are verified on a device instead.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
