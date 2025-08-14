

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react-native": "react-native-web",
      "@react-native-async-storage/async-storage": path.resolve(__dirname, "./src/lib/asyncStorage.ts"),
      "@react-native-community/netinfo": path.resolve(__dirname, "./src/lib/netInfo.ts"),
      "expo-keep-awake": path.resolve(__dirname, "./src/lib/keepAwake.ts"),
    },
  },
}));
