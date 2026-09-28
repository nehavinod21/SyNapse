import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.synapse.aac',
  appName: 'SyNAPSE',
  webDir: 'dist',
  // Serve the built React app from dist. Set VITE_API_URL before `npm run build`.
  // For live reload during native dev only, uncomment and point to your PC IP:
  // server: { url: 'http://192.168.1.73:5173', cleartext: true },
  android: {
    allowMixedContent: true,
    backgroundColor: '#1a3a5c',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a3a5c',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a3a5c',
    },
  },
};

export default config;
