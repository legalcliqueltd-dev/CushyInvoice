

# Fix Apple Sign-In — "Missing OAuth secret" Error

## Problem
Apple Sign-In fails with `{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: missing OAuth secret"}` because the code calls `supabase.auth.signInWithOAuth({ provider: "apple" })` directly. The Apple OAuth provider has no credentials configured in the backend.

## Solution
Switch to Lovable Cloud's **managed Apple OAuth** by using `lovable.auth.signInWithOAuth("apple", ...)` instead of the direct Supabase call. This is the same approach used for Google Sign-In and requires zero backend configuration — Lovable Cloud handles it automatically.

## Changes

### `src/pages/Auth.tsx`
Update `handleAppleSignIn` to:
- **Web**: Use `lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin })` (managed auth, no backend config needed)
- **Native (Capacitor)**: Use the browser-based OAuth flow via `lovable.auth.signInWithOAuth("apple", ...)` with the mobile callback redirect, same pattern as Google

This mirrors the existing Google Sign-In implementation which already uses the `lovable` module successfully.

## No backend changes needed
Lovable Cloud's managed Apple auth works out of the box — no secrets or provider configuration required.

