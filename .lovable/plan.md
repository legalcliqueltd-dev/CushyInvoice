

## Goal

Fix four issues across the iOS app and the dashboard:

1. RevenueCat error "Subscription products are not yet configured" still shows on the real iOS device.
2. Subscription dialogs (`SubscriptionGuard`, `TrialBanner`) still tell iOS users to "visit cushyinvoice.com" — this should now use the in-app purchase flow.
3. Add a small "Current Plan" card on the Dashboard with a one-tap subscribe/manage button (all platforms).
4. Add a back arrow at the top-left of the `/subscribe` page.

---

## 1. Fix the iOS "products not configured" error

The error message comes from `Subscribe.tsx` when `rc.offering` is `null`. The Xcode logs show **why**: all four App Store products are still in **`READY_TO_SUBMIT`** status. RevenueCat cannot fetch them from App Store Connect until they're either:

- **Approved** (submitted with an app build that goes through Apple review), OR
- **Marked "Ready for Review"** with all required metadata complete

This is a **configuration issue in App Store Connect**, not a code bug. To make the app usable while products are pending review, we'll improve the iOS flow:

- **Auto-retry** loading offerings on mount (sometimes the first call fails before StoreKit is ready).
- **Show a clear, friendly state** when offerings are unavailable — explaining products are pending Apple review — instead of a generic error toast.
- **Add a "Refresh" button** so users can retry once products are approved without restarting the app.
- **Log more detail** to console so you can see exactly what RevenueCat returned.

The user-facing fix in App Store Connect (you must do this manually):
- App Store Connect → My Apps → CushyInvoice → **In-App Purchases**
- For each product (`cushyinvoice_premium_monthly`, `cushyinvoice_yearly`):
  - Add localization (display name + description in English)
  - Add a 1024×1024 review screenshot
  - Click **"Submit for Review"** (they'll attach to your next app submission)
  - For sandbox testing, the status only needs to be **"Waiting for Review"** — sandbox doesn't require approval

---

## 2. Update dialogs to use in-app purchases on iOS

Now that RevenueCat IAP is wired up, iOS users **can** subscribe inside the app — Apple compliance is satisfied. Update the two components that still send users to the browser:

**`src/components/SubscriptionGuard.tsx`**
- Remove the iOS-specific "visit cushyinvoice.com" text.
- Always show the **"Upgrade Now"** button on all platforms — it navigates to `/subscribe`, which already routes to RevenueCat IAP on iOS.

**`src/components/TrialBanner.tsx`**
- Same change: remove the iOS browser message and always show **"Upgrade Now"** → `/subscribe`.

---

## 3. Add a "Current Plan" card to the Dashboard

Insert a compact card on the Dashboard (above the stats grid, below `TrialBanner`) that shows:

- **Plan badge**: "Free Trial" / "Premium Monthly" / "Premium Yearly" / "Expired"
- **Status detail**: Days left in trial, or renewal/expiry date for premium
- **Action button**:
  - Free trial / expired → **"Upgrade"** → navigates to `/subscribe`
  - Active premium → **"Manage"** → navigates to `/settings` (billing tab) on web/Android, or opens iOS Settings → Apple ID → Subscriptions on iOS

Visual: small horizontal card, primary-tinted icon (Crown or Zap), name + status on the left, action button on the right. Matches the existing `neo-card-subtle` style. Same UI on iOS, Android, and web.

---

## 4. Back arrow on `/subscribe`

Add a back button in the top-left corner of the Subscribe page that calls `navigate(-1)` to return to the previous page. It will use the `ArrowLeft` icon and respect iOS safe-area-inset-top so it doesn't collide with the notch.

The existing "Back to Home" button at the bottom will be removed (replaced by the top-left arrow).

---

## Files to change

| File | Change |
|---|---|
| `src/pages/Subscribe.tsx` | Add top-left back arrow (safe-area aware), remove bottom "Back to Home", improve iOS empty-offering state with retry button + clearer message, add console logging |
| `src/components/SubscriptionGuard.tsx` | Remove iOS browser message, always show Upgrade button |
| `src/components/TrialBanner.tsx` | Remove iOS browser message, always show Upgrade button |
| `src/pages/Dashboard.tsx` | Add `<CurrentPlanCard />` above stats grid |
| `src/components/CurrentPlanCard.tsx` (new) | Compact card showing plan + Upgrade/Manage button, platform-aware |

No backend or database changes. No new dependencies.

---

## Technical notes

- iOS plan detection: `useSubscription` already exposes `subscription.subscribed`, `current_plan`, `trial_end`. The card derives display state from these.
- For the iOS "Manage" action, we use `App.openUrl({ url: "itms-apps://apps.apple.com/account/subscriptions" })` from `@capacitor/app` (already installed) which opens the Apple Subscriptions screen directly.
- The retry on Subscribe re-runs the `getCurrentOffering()` call — no SDK re-init needed.

