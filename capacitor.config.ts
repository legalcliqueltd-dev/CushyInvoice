import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cushyinvoice.app',
  appName: 'cushyinvoice',
  webDir: 'dist',
  server: {
    cleartext: true,
    allowNavigation: [
      'accounts.google.com',
      '*.google.com',
      '*.supabase.co',
      'cushyinvoice.com',
      '*.cushyinvoice.com',
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: false,
      backgroundColor: '#1a56db',
      showSpinner: true,
      spinnerColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
