

# Fix Google OAuth for Native App (Capacitor Only)

The landing page and web app are working fine -- no changes needed there. This plan focuses solely on fixing the Google sign-in "restricted" / "disallowed_useragent" error that happens **only in the native mobile app**.

---

## Problem

Google blocks OAuth sign-in from WebViews (showing "restricted" or "disallowed_useragent"). The current code already attempts to use `@capacitor/browser` to open a system browser, but the dynamic imports cause Vite/Rollup build failures in the Lovable environment, even with `rollupOptions.external`.

## Solution

Remove the Capacitor plugin imports entirely from `Auth.tsx` and instead use a **plain `window.open()` approach** for the native app OAuth flow. This avoids all build issues while still working correctly in Capacitor.

---

## Changes

### 1. `src/pages/Auth.tsx` -- Simplify native Google OAuth

**What changes:** Replace the `@capacitor/browser` and `@capacitor/app` dynamic imports with a simpler approach:

- For **web**: Keep the current `supabase.auth.signInWithOAuth()` as-is (no changes).
- For **native app (Capacitor)**: Use `skipBrowserRedirect: true` to get the OAuth URL, then open it with `window.open()`. The Capacitor WebView will handle the redirect back to the app via the `allowNavigation` config. The existing `onAuthStateChange` listener in the `useEffect` will detect the session and redirect to dashboard.

This completely eliminates the need for `@capacitor/browser` and `@capacitor/app` imports.

### 2. `vite.config.ts` -- Remove unnecessary externals

Remove `@capacitor/browser` and `@capacitor/app` from `rollupOptions.external` since they are no longer imported anywhere.

---

## What stays the same (no changes)

- Landing page (`Index.tsx`) -- untouched
- Web Google OAuth flow -- unchanged
- Dashboard banners on web -- unchanged
- Splash screen -- already implemented
- Back button -- already implemented
- Invoice detail fixes -- already implemented
- Template button on invoice creation -- already implemented
- `CompactUpgradeBanner` on native -- already implemented

---

## Technical Details

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Replace Capacitor plugin imports with `window.open()` for native OAuth |
| `vite.config.ts` | Remove `@capacitor/browser` and `@capacitor/app` from external |

The key insight: Capacitor's WebView already handles navigation via `allowNavigation: ['*.supabase.co', '*.google.com']` in `capacitor.config.ts`. When the OAuth redirect completes back to `https://cushyinvoice.com/auth`, the WebView loads it, the `onAuthStateChange` listener fires, and the user is redirected to the dashboard. No special plugins needed.

