

# Plan: Make green "7 days free" button clickable + diagnose RevenueCat config

## Part A — Make the green pill clickable (UI change)

Currently the green "7 days free" pill is a static `<div>` label (line 425 of `src/pages/Subscribe.tsx`). I'll convert it into a real button that triggers the same purchase flow as the main "Start 7-Day Free Trial" button below it.

**Behavior:**
- Tap green pill → same as tapping the black "Start 7-Day Free Trial" button (calls `handleSubscribe(plan.id)`)
- Disabled when `loading` is active or (on iOS) when `rc.ready` is false
- Shows hover/active states for feedback
- Keeps the current visual style (success green background, white text, full width)

**File to change:** `src/pages/Subscribe.tsx` — replace the `<div>` on line 425 with a `<button>` that has the same styling plus `onClick`, `disabled`, and accessibility attributes.

That's a 5-line change.

---

## Part B — The REAL issue: why your iOS prices show "Unavailable"

Making the green button clickable **will not fix** the "Unavailable" / "Subscriptions pending review" message. That comes from a RevenueCat ↔ App Store Connect configuration mismatch, shown clearly in your Xcode logs:

> `[RevenueCat] fetch offerings failed: code 23 — None of the products registered in the RevenueCat dashboard could be fetched from App Store Connect`

This is **not a code problem** — your app is correctly catching the error and showing the right UI. The fix is in your RevenueCat + App Store Connect dashboards. Common causes for error code 23:

| # | Likely cause | Where to fix |
|---|---|---|
| 1 | Product IDs in RevenueCat don't EXACTLY match the ones in App Store Connect (case-sensitive, including bundle prefix) | RevenueCat → Products tab |
| 2 | Products in App Store Connect are still in **"Missing Metadata"** / **"Waiting for Review"** state — they need to be at least **"Ready to Submit"** to be fetchable | App Store Connect → My Apps → Subscriptions |
| 3 | **Paid Apps Agreement** in App Store Connect not signed / banking & tax info incomplete | App Store Connect → Business → Agreements, Tax, and Banking |
| 4 | Bundle ID mismatch — RevenueCat app bundle ID ≠ Xcode bundle ID (`com.cushyinvoice.app`) | RevenueCat → Project → Apps → iOS app |
| 5 | App-Specific Shared Secret missing in RevenueCat (required for receipt validation) | App Store Connect → App Info → App-Specific Shared Secret → paste into RevenueCat |

After Part A is shipped, I'll walk you through diagnosing #1–#5 one by one based on what you see in each dashboard. None of those require code changes from me.

---

## Technical details

- File modified: `src/pages/Subscribe.tsx` (single component, single replacement)
- No new dependencies
- No backend / edge function changes
- No database changes
- Functionality unchanged on web/Android (still uses Stripe/Paystack), unchanged on iOS (still uses RevenueCat) — the green pill simply triggers the existing `handleSubscribe(plan.id)` handler
- Accessibility: real `<button>` with `aria-label`, keyboard focus ring, disabled state

