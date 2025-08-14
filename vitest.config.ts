import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react-native': path.resolve(__dirname, './test/mocks/react-native.ts'),
      '@react-native-async-storage/async-storage': path.resolve(__dirname, './test/mocks/async-storage.ts'),
      '@react-native-community/netinfo': path.resolve(__dirname, './test/mocks/netinfo.ts'),
      'expo-keep-awake': path.resolve(__dirname, './test/mocks/expo-keep-awake.ts'),
    },
  },
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
