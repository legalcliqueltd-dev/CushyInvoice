

## Fix: Native Google Sign-In on iOS — Root Cause & Solution

### Root Cause

**Line 244 in `src/pages/Auth.tsx`** explicitly removes `serverClientId` on iOS:

```typescript
...(platform === "ios" ? {} : { serverClientId: WEB_CLIENT_ID }),
```

This means the native plugin initializes without a `serverClientId`, so it **cannot return an ID token** that Supabase can verify. The `signIn()` call either fails or returns no `idToken`, causing the code to fall through to the browser OAuth fallback on line 282.

**Second issue:** After the browser OAuth completes and redirects back, the session is never restored because the `DeepLinkHandler` depends on `@capacitor/app`'s `appUrlOpen` event, but the redirect goes to `auth-mobile-callback.html` which tries to redirect via `cushyinvoice://` custom scheme — and the app may not pick it up reliably.

### Fix

**File: `src/pages/Auth.tsx`**

1. **Pass `serverClientId` on iOS too** — change line 244 from excluding it on iOS to always including it:
   ```typescript
   await googleAuthPlugin.initialize({
     clientId: platform === "ios" ? IOS_CLIENT_ID : WEB_CLIENT_ID,
     serverClientId: WEB_CLIENT_ID,  // ALWAYS pass this
     scopes: ["profile", "email"],
     grantOfflineAccess: true,
   });
   ```

2. **Remove the silent browser fallback** — if the native plugin is found but `signIn()` fails with a real error, show the error to the user instead of silently falling through to browser OAuth. Only fall back to browser if the native plugin is genuinely not available (`googleAuthPlugin` is null).

3. **Add detailed error logging** — log the full error object when native sign-in fails so you can diagnose on-device.

### Summary

The fix is a one-line change: always pass `serverClientId: WEB_CLIENT_ID` in the `initialize()` call regardless of platform. The current code deliberately strips it on iOS, which is why the native flow never works.

