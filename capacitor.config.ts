
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.977569503c8541a494aea14ccf690d68',
  appName: 'hytte-sjekk-klar',
  webDir: 'dist',
  server: {
    url: 'https://97756950-3c85-41a4-94ae-a14ccf690d68.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    }
  }
};

export default config;
