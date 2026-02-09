

# Mobile App Enhancement Plan

## Overview
Three major improvements for the CushyInvoice native mobile apps: fix iOS domain config, add a branded splash screen, and optimize the UI for mobile screens -- all while keeping the neobrutalism style, animations, gradients, and noise textures intact.

---

## 1. iOS Custom Domain Fix

Update `capacitor.config.ts` to ensure both iOS and Android use `https://cushyinvoice.com`. The current config already has `server.url` set to `https://cushyinvoice.com`, so this is already correct for both platforms. No changes needed here -- Capacitor applies the `server` config to both iOS and Android.

---

## 2. Splash Screen

### What will happen
- Install `@capacitor/splash-screen` plugin
- Configure splash screen settings in `capacitor.config.ts` with auto-hide after the app loads
- Add splash screen image assets to the `public/` folder (a simple branded splash with the CushyInvoice logo on a primary blue background)
- Call `SplashScreen.hide()` in `main.tsx` after the React app mounts

### Splash screen design
- Background: Primary blue gradient matching the neobrutalism theme
- Center: CushyInvoice logo (Receipt icon + text)
- Auto-hide after 2 seconds or when app is ready

---

## 3. Mobile UI Optimization

All changes will preserve the existing neobrutalism aesthetic (thick borders, offset shadows, noise textures, gradient buttons, blob animations).

### 3a. Viewport & Safe Areas (`index.html`)
- Add `viewport-fit=cover` to the viewport meta tag
- Add `apple-mobile-web-app-capable` and status bar meta tags
- Add safe area padding via CSS env() variables

### 3b. Global Mobile CSS (`src/index.css`)
- Add safe area inset utilities using `env(safe-area-inset-*)` for notch/home indicator support
- Add touch-friendly tap highlight removal
- Add `-webkit-overflow-scrolling: touch` for smooth scrolling
- Ensure noise overlay and neo-card styles still render correctly on mobile

### 3c. Dashboard Layout (`src/components/DashboardLayout.tsx`)
- Add bottom safe area padding to the sidebar
- Make the top header respect safe area insets (notch)
- Increase mobile touch targets for nav items (min 44px height)
- Add bottom navigation bar for mobile (visible on small screens only) with key quick-access items: Dashboard, Invoices, Clients, and a "More" menu
- Keep the existing sidebar for tablet/desktop

### 3d. Landing Page (`src/pages/Index.tsx`)
- Add safe area padding to the sticky nav and footer
- Reduce hero text sizes slightly on very small screens (< 375px)
- Make CTA buttons full-width on mobile
- Ensure blob animations don't cause horizontal overflow on mobile (add `overflow-x: hidden` to container)

### 3e. Auth Page (`src/pages/Auth.tsx`)
- Add safe area padding
- Ensure form inputs have proper `font-size: 16px` to prevent iOS zoom on focus

### 3f. General Touch Improvements
- All interactive elements will have minimum 44x44px touch targets
- Add `touch-action: manipulation` to prevent double-tap zoom on buttons

---

## Technical Details

### Files to create
- None (splash screen assets will be generated natively via Capacitor after `cap sync`)

### Files to modify
1. **`capacitor.config.ts`** -- Add splash screen plugin config
2. **`index.html`** -- Add mobile meta tags, viewport-fit, apple-mobile-web-app tags
3. **`src/index.css`** -- Add safe area utilities, touch styles, mobile bottom nav styles
4. **`src/components/DashboardLayout.tsx`** -- Add mobile bottom navigation bar, safe area support, larger touch targets
5. **`src/pages/Index.tsx`** -- Mobile-responsive improvements, overflow fix
6. **`src/main.tsx`** -- Add SplashScreen.hide() call on mount
7. **`package.json`** -- Add `@capacitor/splash-screen` dependency

### After implementation
You will need to:
1. Pull the latest code from GitHub
2. Run `npm install`
3. Run `npx cap sync` to sync splash screen and config changes
4. Rebuild in Android Studio / Xcode
