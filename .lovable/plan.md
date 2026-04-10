

# Fix Apple App Store Rejection — CushyInvoice

Apple rejected the app for three reasons. Here is what each means and how to fix it.

---

## Issue 1: Guideline 4.8 — Sign in with Apple Required

**Problem:** The app offers Google Sign-In (a third-party login) but does not offer Sign in with Apple as an equivalent option.

**Fix:** Add "Sign in with Apple" as a login option on the Auth page, alongside Google Sign-In.

- Use Lovable Cloud's managed OAuth to add Apple as a provider (`lovable.auth.signInWithOAuth("apple", ...)`)
- Configure Apple OAuth via the `cloud--configure_auth` tool
- Add an "Sign in with Apple" button on the Auth page (both web and native flows)
- For native iOS, use the same Capacitor browser-based OAuth fallback pattern already used for iOS Google Sign-In

**Files changed:** `src/pages/Auth.tsx`

---

## Issue 2: Guideline 3.1.1 — In-App Purchase Required

**Problem:** The app sells subscriptions via Stripe/Paystack inside the app. Apple requires that digital subscriptions purchased within iOS apps use Apple's In-App Purchase system.

**Fix (simplest approach):** On iOS, hide the external payment buttons and either:
- **(Option A)** Remove the subscribe/payment UI entirely on iOS and let users subscribe via the website only, OR
- **(Option B)** Add a note directing iOS users to subscribe at cushyinvoice.com (Apple now allows linking out for qualifying apps in the US storefront)

Since implementing native StoreKit IAP is complex and requires significant native Swift code, the practical fix is **Option A**: detect iOS native platform and hide the Stripe/Paystack subscription buttons. Users can still subscribe via the web.

- In `src/pages/Subscribe.tsx`: detect `Capacitor.getPlatform() === 'ios'` and hide the payment buttons, showing a message instead
- In `src/pages/Settings.tsx`: hide subscription management buttons on iOS
- In `src/components/SubscriptionGuard.tsx` and `src/components/TrialBanner.tsx`: ensure any "Subscribe" CTAs don't link to external payment on iOS

**Files changed:** `src/pages/Subscribe.tsx`, `src/pages/Settings.tsx`, and any components with subscribe CTAs

---

## Issue 3: Guideline 5.1.1(v) — Account Deletion Required In-App

**Problem:** The app has a `/delete-account` web page but does not offer account deletion from within the app itself. Apple requires the deletion flow to be accessible inside the app, not just on a website.

**Fix:** Add a "Delete Account" option inside the Settings page (security tab) that lets authenticated users delete their account directly. This should:

1. Add a "Delete Account" button in Settings > Security tab
2. Show a confirmation dialog explaining what will be deleted
3. On confirm, call a backend function that deletes the user's data and auth account
4. Create a new edge function `delete-account` that:
   - Authenticates the user
   - Deletes all user data from tables (invoices, clients, products, expenses, etc.)
   - Deletes the user's auth account via `supabase.auth.admin.deleteUser()`
   - Signs the user out

**Files changed:** `src/pages/Settings.tsx`, new edge function `supabase/functions/delete-account/index.ts`
**Database:** No schema changes needed — just deletes via existing foreign key cascades

---

## Summary of Steps

1. Configure Apple OAuth provider via Lovable Cloud tools
2. Add "Sign in with Apple" button to the Auth page
3. Hide Stripe/Paystack payment UI on iOS native platform
4. Add in-app account deletion in Settings with backend edge function
5. Rebuild and resubmit to App Store

