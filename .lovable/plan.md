

## Problem Analysis

The "code 10" (DEVELOPER_ERROR) error means the native Google Sign-In plugin **cannot** authenticate because the app's SHA-1 signing fingerprint is not registered in Google Cloud Console. The current fallback opens an external system browser, which:
- Requires a full new sign-in (no access to device accounts)
- Doesn't redirect back to the app (Android App Links not verified)

The native Google account picker (the one that shows existing device accounts as a bottom sheet) **only works** when the SHA-1 fingerprint is correctly configured. No code change can bypass this -- it's a Google security requirement.

## Plan

### Step 1: Fix the root cause -- register SHA-1 fingerprints

You need to add your Android app's SHA-1 fingerprint to the Google Cloud Console OAuth client. This is the **only** way to get the native in-app account picker working.

**How to get your SHA-1:**
- **Debug builds:** Run in your project terminal:
  ```text
  cd android
  ./gradlew signingReport
  ```
  Copy the SHA-1 from the debug variant.

- **Release builds:** If you sign with a keystore, get it from there. If using Play App Signing, get it from Google Play Console → Setup → App signing.

**Where to add it:**
1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Credentials
2. Create (or edit) an **Android** OAuth 2.0 client ID
3. Set package name: `app.lovable.e23699a8f80e4b9dbb96d8d50a1c74ed`
4. Paste the SHA-1 fingerprint
5. Save

### Step 2: Improve the fallback to use Chrome Custom Tabs (not external browser)

If native auth still fails for any reason, change the fallback to use Chrome Custom Tabs (in-app overlay) with a **custom URL scheme** redirect (`cushyinvoice://auth/callback`) so Android automatically routes back to the app.

**Code changes in `src/pages/Auth.tsx`:**
- Change `redirectTo` in the code-10 fallback from `https://cushyinvoice.com/auth` to `cushyinvoice://auth/callback`
- Remove `windowName: "_system"` from `Browser.open()` so it uses Chrome Custom Tabs (appears as an overlay inside the app)
- Update the `appUrlOpen` listener to also handle the `cushyinvoice://` scheme tokens

**Backend configuration:**
- Add `cushyinvoice://auth/callback` to the allowed redirect URLs in the authentication settings

### Step 3: Host assetlinks.json (optional, for https deep links)

If you want `https://cushyinvoice.com/auth` deep links to also work (returning from browser to app), host a `/.well-known/assetlinks.json` file on cushyinvoice.com with the app's SHA-256 fingerprint. This is optional since the custom scheme approach in Step 2 is more reliable.

## Summary

- **Step 1** fixes the native picker (best UX -- stays fully in-app, shows device accounts)
- **Step 2** provides a reliable in-app fallback using Chrome Custom Tabs + custom scheme redirect
- Steps 1 and 2 together ensure Google Sign-In always works within the app

