

# Plan: Fix Templates, Add Cancel Subscription, and Set Up Native Mobile Apps

## 1. Fix Templates Page Not Loading

The Templates page is wrapped in a `SubscriptionGuard` component that blocks the entire page if the user isn't subscribed. Even for subscribed users, the subscription check may be failing or slow, causing the page to appear stuck on a loading spinner.

**Changes:**
- Remove `SubscriptionGuard` as the page wrapper -- instead, show default templates to all users and only gate custom template creation behind the subscription check
- Add `DashboardLayout` wrapper (currently missing -- every other protected page uses it, but Templates doesn't)
- Fix the loading state to show within the dashboard layout instead of a blank full-screen spinner

**Files:** `src/pages/Templates.tsx`

## 2. Improve Templates Page Design

- Add the `DashboardLayout` wrapper for consistent navigation
- Improve the default template cards with a mini invoice preview mockup instead of plain color blocks
- Add hover effects and better spacing
- Make the "Create Template" button more prominent
- Improve the empty state design
- Ensure responsive grid layout works on mobile

**Files:** `src/pages/Templates.tsx`

## 3. Add Cancel Subscription Option

Currently, the Settings > Billing tab has a "Manage Subscription" button that opens the Stripe Customer Portal. This already allows cancellation, but there's no explicit "Cancel Subscription" button visible.

**Changes:**
- Add a dedicated "Cancel Subscription" button in the Billing tab alongside "Manage Subscription"
- The button will open the Stripe Customer Portal directly (same `customer-portal` edge function)
- Add a confirmation dialog before redirecting to the portal
- Show clear messaging about what happens when they cancel (access continues until end of billing period)

**Files:** `src/pages/Settings.tsx`

## 4. Set Up Capacitor for Native Mobile Apps (iOS and Android)

This sets up the foundation so you can build real native apps from the existing web app.

**Changes:**
- Install Capacitor dependencies: `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`, `@capacitor/android`
- Create `capacitor.config.ts` with:
  - App ID: `app.lovable.e23699a8f80e4b9dbb96d8d50a1c74ed`
  - App Name: `cushyinvoice`
  - Hot-reload server URL pointing to preview sandbox for development

**After implementation, you will need to do the following on your local machine:**
1. Export the project to GitHub via the "Export to GitHub" button, then clone it
2. Run `npm install`
3. Run `npx cap add ios` and/or `npx cap add android`
4. Run `npx cap update ios` or `npx cap update android`
5. Run `npm run build`
6. Run `npx cap sync`
7. Run `npx cap run ios` (requires Mac with Xcode) or `npx cap run android` (requires Android Studio)

**Files:** `capacitor.config.ts`, `package.json`

---

## Technical Summary

| Task | Files Changed |
|------|--------------|
| Fix Templates loading | `src/pages/Templates.tsx` |
| Templates design improvement | `src/pages/Templates.tsx` |
| Cancel subscription button | `src/pages/Settings.tsx` |
| Capacitor setup | `capacitor.config.ts`, `package.json` |

