

# Comprehensive Fix Plan for CushyInvoice

## Overview
This plan covers all outstanding fixes discussed in our conversation: Apple Sign-In 404 on web, garbled display names, iOS subscription redirect, and Lovable branding removal.

---

## Fix 1: Apple Sign-In 404 on Custom Domain (Web)

**Problem:** Clicking "Sign in with Apple" on `cushyinvoice.com` hits a 404 because `/~oauth/initiate` only works on `*.lovable.app` domains.

**Current code (Auth.tsx ~line 343):** Uses `lovable.auth.signInWithOAuth("apple", ...)` which constructs the URL using the current origin (`cushyinvoice.com`).

**Fix:** For web Apple Sign-In, manually redirect to the OAuth broker on the `.lovable.app` domain:
```typescript
const appleOAuthUrl = `https://cushyinvoice.lovable.app/~oauth/initiate?provider=apple&redirect_uri=${encodeURIComponent(`${APP_DOMAIN}/auth`)}`;
window.location.href = appleOAuthUrl;
return;
```
The user lands back on `cushyinvoice.com/auth` after authentication, and the existing `onAuthStateChange` listener picks up the session.

**File:** `src/pages/Auth.tsx` (lines 341-360)

---

## Fix 2: Garbled Display Name for Apple Sign-In Users

**Problem:** Apple hides user names by default. When a user signs in with Apple, `user_metadata.full_name` is often empty or garbled, resulting in random characters shown as the display name.

**Current code (DashboardLayout.tsx ~line 109):** Already returns "Apple Account" as fallback, but only when provider is `apple` AND `full_name`/`name` are both empty. The issue is that Apple sometimes returns an obfuscated string that isn't empty.

**Fix:** Update `getUserDisplayName` and `ensureProfileExists` to:
1. First check the `profiles` table for a stored `full_name` (set during email/password signup or manually).
2. For Apple provider, if the metadata name looks like a relay email or garbled ID (e.g., contains `privaterelay.appleid.com` or is just alphanumeric noise), fall back to "Apple Account".
3. For Google provider, trust `user_metadata.full_name` or `name` as-is (Google always provides real names).

**Files:** `src/components/DashboardLayout.tsx` (lines 105-129), `src/pages/Auth.tsx` (lines 59-90)

---

## Fix 3: iOS Subscription — Redirect to Web Payment Instead of Static Message

**Problem:** On iOS native, the subscribe page shows a static "Subscribe via Web" message instead of actually redirecting users to pay.

**Fix:** Replace the static message with a functional flow:
1. On iOS native, show the plan cards normally (remove `!isIOSNative` guards on plan cards).
2. When user taps "Start 7-Day Free Trial", use `@capacitor/browser` to open `https://cushyinvoice.com/subscribe` in Safari.
3. User completes payment on the web (Stripe/Paystack handles checkout).
4. After payment, Stripe/Paystack redirects to `https://cushyinvoice.com/payment-success`.
5. User manually returns to the app; subscription status syncs automatically via the database.

**Key considerations:**
- Hide the provider toggle on iOS (web page handles that).
- The "return to app" step is manual — user closes Safari and reopens the app. No custom-scheme deep link is needed because the subscription status is stored in the database and checked on app launch.
- No bridge page needed; the payment success page stays in Safari and the app checks subscription status independently.

**File:** `src/pages/Subscribe.tsx` (lines 69-78, 163-209)

---

## Fix 4: Hide "Edit with Lovable" Badge

**Problem:** The Lovable badge is visible on the published site at `cushyinvoice.com`.

**Fix:** Use the `set_badge_visibility` tool to hide the badge (requires Pro plan or higher, which the project has).

**No code changes needed** — this is a platform setting.

---

## Summary of File Changes

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Web Apple Sign-In: manual redirect via `.lovable.app` domain |
| `src/components/DashboardLayout.tsx` | Smarter display name logic for Apple users |
| `src/pages/Subscribe.tsx` | iOS: redirect to web subscribe page via in-app browser |
| Platform setting | Hide Lovable badge |

