

# Comprehensive Mobile App Fixes

This plan addresses 6 issues: blank invoice page, Google OAuth "restricted" error, dashboard banner clutter, branded splash screen, back button navigation, and template creation from invoice page.

---

## 1. Fix Blank Invoice Detail Page

**Root Cause:** Line 216 in `InvoiceDetail.tsx` calls `invoice?.payments.reduce(...)` -- if `payments` is `null` (Supabase returns `null` for empty relations), this crashes and the page goes blank. Also, line 111 uses `.single()` which throws a hard error if no row is found.

**Fix in `src/pages/InvoiceDetail.tsx`:**
- Change `.single()` (line 111) to `.maybeSingle()` to prevent hard crashes
- Change `invoice?.payments.reduce(...)` (line 216) to `(invoice?.payments || []).reduce(...)`
- Wrap `format(new Date(invoice.issue_date))` calls in try-catch with fallback text

---

## 2. Fix Google OAuth "Restricted" Error

**Root Cause:** The "restricted" message comes from Google's OAuth consent screen. Your app is likely still in "Testing" mode in Google Cloud Console, which limits sign-in to only pre-approved test users.

**What you need to do (outside of code):**
1. Go to Google Cloud Console > APIs & Services > OAuth consent screen
2. If the app is in "Testing" mode, click "Publish App" to move it to "In production"
3. If the app requests only basic scopes (email, profile, openid), Google will approve it immediately without verification
4. Alternatively, if keeping it in Testing mode, add any test user emails to the "Test users" list

**Code fix in `src/pages/Auth.tsx`:**
- Add a more helpful error message when Google sign-in fails, telling users to contact support if they see "restricted"

---

## 3. Replace Dashboard Banners with Compact Banner on Mobile

**Problem:** Four stacked elements (TrialBanner, UpgradeBanner, PlanLimitsBanner, AdSenseAd) push dashboard content below the fold on mobile.

**Changes:**
- Create **`src/components/CompactUpgradeBanner.tsx`** -- a slim, single-line dismissible banner (~48px) that shows trial days remaining and a small "Upgrade" CTA button. Uses `sessionStorage` to remember dismissal within a session.
- **`src/pages/Dashboard.tsx`** -- Detect Capacitor with `(window as any).Capacitor`. If native app, render only `CompactUpgradeBanner`. If web, keep the existing 4 banners as-is.

---

## 4. Branded Splash Screen with Logo

**Changes in `src/main.tsx`:**
- Before rendering the React app, show a full-screen branded overlay (blue background #1a56db with the CushyInvoice logo centered) for 1.5 seconds
- The overlay fades out, then the app renders
- This works in both Capacitor and web, giving a native feel

**For the native Capacitor splash:** The `capacitor.config.ts` already has splash screen config with the blue background. After building, you will need to place your logo image in the platform resource folders:
- Android: `android/app/src/main/res/drawable/splash.png`
- iOS: `ios/App/App/Assets.xcassets/Splash.imageset/`

---

## 5. Back Button on All Pages

**Changes in `src/components/DashboardLayout.tsx`:**
- Add a back arrow (ArrowLeft icon) button in the top header bar, next to the hamburger menu
- Only visible when the current route is NOT `/dashboard` (since dashboard is home)
- Uses `navigate(-1)` to go to the previous page in history
- Minimum 44x44px touch target for mobile

---

## 6. "Create Template" Button on Invoice Creation Page

**Changes in `src/pages/InvoiceNew.tsx`:**
- Add a "+" button next to the Template selector (lines 780-805), similar to the existing "Add Client" button pattern
- Clicking it navigates to `/templates` where users can create custom templates

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/pages/InvoiceDetail.tsx` | `.single()` to `.maybeSingle()`, null-safe payments access, date formatting safety |
| `src/pages/Auth.tsx` | Better error message for "restricted" Google OAuth error |
| `src/components/CompactUpgradeBanner.tsx` | NEW - slim dismissible upgrade banner for native app |
| `src/pages/Dashboard.tsx` | Use CompactUpgradeBanner in Capacitor, keep full banners on web |
| `src/main.tsx` | Add branded splash overlay with logo on blue background |
| `src/components/DashboardLayout.tsx` | Add back button in header for non-dashboard pages |
| `src/pages/InvoiceNew.tsx` | Add "Create Template" navigation button next to template selector |
| `capacitor.config.ts` | Broaden `allowNavigation` to `*.supabase.co` |

**Important note about the "restricted" Google OAuth error:** This is a Google Cloud Console configuration issue, not a code issue. You must publish your OAuth app from "Testing" to "In production" in the Google Cloud Console, or add test users to the allowed list. The code changes will only improve the error message shown to users.

After implementing, rebuild with: `npm run build && npx cap sync ios && npx cap sync android`

