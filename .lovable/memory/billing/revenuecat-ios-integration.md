---
name: revenuecat-ios-integration
description: RevenueCat in-app purchase integration for iOS native subscriptions, replacing web redirect for App Store compliance
type: feature
---

iOS native subscriptions use RevenueCat (`@revenuecat/purchases-capacitor`) for in-app purchases, satisfying Apple Guideline 3.1.1.

## Architecture
- **Project ID**: `projf2000820` (RevenueCat)
- **iOS Public SDK Key**: `appl_cZFOmclzXEcSYxdysAsPeeNGlGu` (hardcoded in `src/lib/revenuecat.ts` — public key, safe)
- **REST API Key**: stored as secret `REVENUECAT_REST_API_KEY` (V2 API, Customer info: Read)
- **Entitlement identifier**: `premium`
- **Package identifiers**: `$rc_monthly` and `$rc_annual` (RevenueCat standard)
- **App User ID**: Supabase user UUID (passed to `Purchases.configure`)

## Files
- `src/lib/revenuecat.ts` — SDK wrapper with isIOSNative gate, init, purchase, restore, getCustomerInfo
- `src/hooks/useRevenueCat.ts` — React hook returning `{ ready, offering, loading, purchase, restore }`
- `supabase/functions/revenuecat-sync/index.ts` — Verifies entitlement via RevenueCat V2 REST API and updates `profiles.is_premium`
- `src/pages/Subscribe.tsx` — On iOS, shows live RevenueCat pricing and triggers `Purchases.purchasePackage`. On web/Android, falls back to Stripe/Paystack.
- `src/hooks/useSubscription.ts` — On iOS, checks RC entitlement before calling `check-subscription` and triggers sync if active.

## Flow
1. User opens `/subscribe` on iOS → `useRevenueCat` initializes SDK with their user ID and fetches the current offering
2. User taps a plan → `Purchases.purchasePackage` opens Apple's native purchase sheet
3. On success → `revenuecat-sync` edge function fetches entitlements via REST and sets `is_premium=true`, `plan_type=premium`, `current_plan=ios_iap`
4. **Restore Purchases** button (Apple-required) calls `Purchases.restorePurchases` and syncs

## App Store Setup Required (manual, outside Lovable)
- Create IAP products in App Store Connect: monthly + annual subscriptions
- Link them in RevenueCat dashboard → Products
- Add to an Offering with `$rc_monthly` and `$rc_annual` package identifiers
- Attach to "premium" entitlement
- Run `npx cap sync ios` and re-archive after pulling changes
