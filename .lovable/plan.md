

## Fix: Native Google Sign-In Still Redirecting to Browser on iOS

### Problem
The `@deldev/capacitor-google-auth` plugin is not registering at runtime because it's missing its required configuration in `capacitor.config.ts`. Without a `plugins.GoogleAuth` block, the native iOS plugin never initializes, so the JS code falls through to the browser OAuth fallback every time.

Additionally, `Info.plist` is missing the `GIDClientID` key that the Google Sign-In SDK on iOS reads at launch to configure itself natively.

### Plan

**1. Add GoogleAuth plugin config to `capacitor.config.ts`**

Add to the `plugins` section:
```typescript
GoogleAuth: {
  scopes: ['profile', 'email'],
  clientId: '261698725488-qsbo20fl2qi11frd50aab93f0r39lckn.apps.googleusercontent.com', // iOS
  serverClientId: '261698725488-o5bgnrchhborkjp2gc7nguidc4b3bbma.apps.googleusercontent.com', // Web
  iosClientId: '261698725488-qsbo20fl2qi11frd50aab93f0r39lckn.apps.googleusercontent.com',
  forceCodeForRefreshToken: true,
}
```

**2. Add `GIDClientID` to `ios/App/App/Info.plist`**

The Google Sign-In iOS SDK reads this key at app launch:
```xml
<key>GIDClientID</key>
<string>261698725488-qsbo20fl2qi11frd50aab93f0r39lckn.apps.googleusercontent.com</string>
```

**3. Simplify native plugin access in `src/pages/Auth.tsx`**

With the config in place, the plugin should register automatically. Update `handleGoogleSignIn` to:
- Remove the `initialize()` call (config is now read from `capacitor.config.ts` at native layer)
- Keep dynamic import as fallback for plugin discovery
- Add a console log showing whether the plugin was found, to aid debugging

### Files to modify
- `capacitor.config.ts` — add GoogleAuth plugin block
- `ios/App/App/Info.plist` — add GIDClientID
- `src/pages/Auth.tsx` — simplify native init, remove redundant initialize() call

### After implementation
Pull changes, run `npx cap sync ios`, rebuild in Xcode, test on device.

