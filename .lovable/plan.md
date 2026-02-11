

## Fix Google OAuth Redirect Issue

### Problem
After signing in with Google, users are not redirected to the dashboard. This happens because:

1. On the Lovable preview domain, `redirectTo` points to `https://cushyinvoice.com/auth` (a different origin), so the OAuth callback tokens never reach the preview app.
2. The project uses Lovable Cloud but isn't using the managed `lovable.auth.signInWithOAuth()` function for the Lovable domain flow, which properly handles the auth-bridge.

### Solution

**Step 1: Configure Lovable Cloud Google OAuth**
- Run the `configure-social-auth` tool for Google to generate the `src/integrations/lovable/` module.

**Step 2: Update `src/pages/Auth.tsx`**
- Import the `lovable` module from `@/integrations/lovable/index`.
- Restructure `handleGoogleSignIn` into three branches:
  1. **Capacitor (native app):** Keep existing logic with `@capacitor/browser` and `skipBrowserRedirect: true`, redirecting to `APP_DOMAIN/auth`.
  2. **Custom domain (cushyinvoice.com):** Keep existing logic using `supabase.auth.signInWithOAuth` with `skipBrowserRedirect: true` and `window.location.origin/auth`.
  3. **Lovable domain (preview/published):** Use `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })` instead of `supabase.auth.signInWithOAuth`. This properly integrates with Lovable's auth-bridge and ensures tokens return to the correct origin.

### Technical Details

The updated `handleGoogleSignIn` function will look like:

```text
if (isCapacitor) {
  // Native app flow - unchanged
  supabase.auth.signInWithOAuth with skipBrowserRedirect + Browser.open()
} else if (isCustomDomain) {
  // Custom domain (cushyinvoice.com) - unchanged
  supabase.auth.signInWithOAuth with skipBrowserRedirect + window.location.href
} else {
  // Lovable domain - NEW: use managed OAuth
  lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })
}
```

No other files need changes. The `onAuthStateChange` listener already handles navigation to `/dashboard` once the session is detected.

