

# Diagnosis & Fix: Google OAuth Redirect Not Returning to Native App

## Root Cause

When the Capacitor app calls `Browser.open(data.url)`, Google OAuth completes and redirects to `https://cushyinvoice.com/auth`. But the **system browser** handles that URL — it loads the website instead of returning to the native app. The `browserFinished` event only fires when the user **manually closes** the browser tab, which is unreliable and doesn't guarantee a session exists.

## Proposed Solution: Native Google Sign-In (no browser)

As you suggested, the best fix is to use the **native Google Sign-In SDK** via `@codetrix-studio/capacitor-google-auth`. This keeps the entire flow inside the app using Google's native UI (account picker sheet), with no browser redirect needed.

## Steps

### 1. Add the native Google Auth plugin
Install `@codetrix-studio/capacitor-google-auth` as a dependency.

### 2. Update `Auth.tsx` — Capacitor branch
Replace the current `Browser.open()` flow with:
```text
1. Call GoogleAuth.signIn() → returns Google ID token
2. Call supabase.auth.signInWithIdToken({ provider: 'google', token })
3. Session is set instantly in-app → navigate to /dashboard
```
No browser opens. No redirect. Everything stays in-app.

### 3. Configure Android `strings.xml` (manual step)
You'll need to add your **Google Web Client ID** (from Google Cloud Console → OAuth 2.0 Client IDs → Web client) to:
- `android/app/src/main/res/values/strings.xml`:
  ```xml
  <string name="server_client_id">YOUR_WEB_CLIENT_ID</string>
  ```

### 4. Initialize the plugin on app start
Add `GoogleAuth.initialize()` in `main.tsx` when running inside Capacitor.

### 5. Keep existing web flow unchanged
The `isCustomDomain` and Lovable-domain branches stay as-is — only the `isCapacitor` branch changes.

## What this achieves
- Google account picker appears as a native bottom sheet (no browser)
- Session is created directly via ID token — no redirect URL needed
- Eliminates the redirect-back-to-app problem entirely
- Web users are completely unaffected

## Manual steps required after implementation
- `npm install` → `npx cap sync android`
- Add your Google Web Client ID to `android/app/src/main/res/values/strings.xml`
- Rebuild the Android app in Android Studio

