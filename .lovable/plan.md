

# Mobile App Improvements Plan

This plan covers 4 areas: removing the landing page for native apps, fixing mobile UI across all pages, diagnosing/fixing the Google sign-in redirect issue, and adding mobile UX utilities.

---

## 1. Skip Landing Page in Native App

**Problem:** The Capacitor app loads the full marketing landing page (Index.tsx) before users can sign in. It should go directly to the Auth page after the splash screen.

**Solution:** Detect Capacitor at runtime and auto-redirect from `/` to `/auth` (or `/dashboard` if already logged in).

**Changes:**
- **`src/pages/Index.tsx`** -- Add a `useEffect` at the top that checks `(window as any).Capacitor`. If running in Capacitor, check for an existing session:
  - If session exists -> navigate to `/dashboard`
  - If no session -> navigate to `/auth`
  - Return a loading spinner while checking, so no landing page content flashes

---

## 2. Fix Mobile UI (Padding, Margins, Overflow)

**Problem:** Elements overflow screen edges, padding is inconsistent, and borders clip on mobile across dashboard, invoices, invoice creation, and other pages.

### 2a. Global CSS Fixes (`src/index.css`)
- Add `overflow-x: hidden` on the `body` and `#root` to prevent horizontal scroll
- Reduce neo-card border/shadow sizes on small screens with a media query
- Make `.neo-btn-subtle` shadows smaller on mobile

### 2b. Dashboard Page (`src/pages/Dashboard.tsx`)
- The top action buttons ("Add Client" / "Create Invoice") overflow on small screens. Wrap them in a responsive layout:
  - Stack vertically on mobile, horizontal on desktop
  - Hide button text on very small screens, show only icons
- Stats grid: use `grid-cols-2` on mobile instead of single column for better use of space

### 2c. Invoices Page (`src/pages/Invoices.tsx`)
- The table already hides date columns on mobile -- good
- Add horizontal scroll container with `-webkit-overflow-scrolling: touch` for the table
- Ensure pagination buttons don't overflow

### 2d. Invoice Creation Form (`src/pages/InvoiceNew.tsx`)
- The company info section (logo + fields side-by-side) already stacks on mobile -- verify it works
- Line items section: on mobile, stack description/quantity/price vertically instead of a horizontal row
- Date pickers: ensure calendar popovers don't overflow the viewport
- Action buttons at bottom: make full-width on mobile

### 2e. Settings Page (`src/pages/Settings.tsx`)
- The 5-column TabsList overflows on mobile. Change to a scrollable horizontal list or reduce to fewer visible tabs with a `ScrollArea`
- Form inputs are already full-width -- good

### 2f. DashboardLayout (`src/components/DashboardLayout.tsx`)
- Add `safe-left` and `safe-right` classes to the main content area
- Ensure bottom nav doesn't overlap content (already has `pb-24` -- verify this is sufficient)

### 2g. AuthLayout (`src/components/AuthLayout.tsx`)
- Add safe-area padding for mobile devices
- Ensure the form doesn't overflow on small screens

---

## 3. Fix Google OAuth Redirect in Native App

**Problem:** Google sign-in opens the browser but doesn't redirect back to the Capacitor app. This is a known Capacitor issue -- OAuth redirects to a web URL (`https://cushyinvoice.com/auth`) which the native WebView doesn't intercept.

**Root Cause:** The `capacitor.config.ts` points to `https://cushyinvoice.com` as the server URL. When Google OAuth completes, it redirects to `https://cushyinvoice.com/auth`, but the external browser doesn't know to send the user back to the app.

**Solution:** Use Capacitor's `@capacitor/browser` plugin or deep linking to handle OAuth redirects. The approach:

- **`src/pages/Auth.tsx`** -- Detect Capacitor environment. When in Capacitor, use a different OAuth flow:
  1. Open the OAuth URL in the system browser using Capacitor Browser plugin
  2. Set up a deep link / app URL scheme to catch the redirect
  3. Extract the auth tokens from the redirect URL and set the session manually

- **Alternative (simpler) approach:** Since the app's WebView already points to `cushyinvoice.com`, configure the OAuth to redirect back to the same domain. The issue is likely that the OAuth opens an external browser (system browser) instead of staying in the WebView. Fix by:
  1. Detecting Capacitor environment in `handleGoogleSignIn`
  2. Using `window.location.href` to navigate to the OAuth URL directly in the WebView instead of letting Supabase open an external browser
  3. The redirect will then happen within the same WebView context

- **`capacitor.config.ts`** -- Add `allowNavigation` to allow the WebView to navigate to Google's OAuth and Supabase callback URLs:
  ```
  server: {
    url: 'https://cushyinvoice.com',
    cleartext: true,
    allowNavigation: [
      'accounts.google.com',
      '*.google.com',
      'figeuiotixafbnbwgvpi.supabase.co'
    ]
  }
  ```

---

## 4. Mobile UX Utilities

Add native-feeling enhancements for the mobile app:

### 4a. Pull-to-Refresh
- Add a custom pull-to-refresh component for dashboard and invoices pages that triggers data reload

### 4b. Haptic-style Feedback (CSS)
- Add `:active` states with scale transforms on all tappable elements for tactile feel

### 4c. Smooth Page Transitions
- Add a subtle slide animation when navigating between pages

### 4d. Better Touch Targets
- Audit all interactive elements to ensure minimum 44x44px touch targets (many already have this via `min-h-[44px]`)

### 4e. Floating Action Button (FAB)
- Add a floating "+" button on the invoices list page for quick invoice creation on mobile (more thumb-friendly than the top bar button)

### 4f. Swipe-to-go-back Gesture Support
- Ensure no horizontal scroll conflicts with iOS swipe-back navigation

### 4g. Status Bar Integration
- Update `index.html` with proper `<meta name="theme-color">` for native status bar coloring
- Add `viewport-fit=cover` to the viewport meta tag for full-screen experience on notch devices

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Add Capacitor detection to skip landing page |
| `src/index.css` | Mobile-specific CSS fixes for overflow, shadows, touch feedback |
| `src/pages/Dashboard.tsx` | Responsive button layout, stats grid fixes |
| `src/pages/Invoices.tsx` | Table scroll, pagination fixes |
| `src/pages/InvoiceNew.tsx` | Stacked line items on mobile, full-width buttons |
| `src/pages/Settings.tsx` | Scrollable tabs on mobile |
| `src/components/DashboardLayout.tsx` | Safe-area padding, layout tightening |
| `src/components/AuthLayout.tsx` | Safe-area support for mobile |
| `src/pages/Auth.tsx` | Fix Google OAuth for Capacitor WebView |
| `capacitor.config.ts` | Add `allowNavigation` for OAuth domains |
| `index.html` | Add viewport-fit=cover, theme-color meta tags |

After implementing, you will need to pull the latest code and rebuild the app with `npm install`, `npm run build`, and `npx cap sync` to test on your device.

