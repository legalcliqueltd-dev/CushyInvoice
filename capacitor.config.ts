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
    GoogleAuth: {
      scopes: ['profile', 'email'],
      clientId: '261698725488-qsbo20fl2qi11frd50aab93f0r39lckn.apps.googleusercontent.com',
      serverClientId: '261698725488-o5bgnrchhborkjp2gc7nguidc4b3bbma.apps.googleusercontent.com',
      iosClientId: '261698725488-qsbo20fl2qi11frd50aab93f0r39lckn.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
