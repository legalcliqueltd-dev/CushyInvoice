

## Problem

Google Sign-In on the web (cushyinvoice.com) fails because `@lovable.dev/cloud-auth-js` is externalized in the Vite build config. When the browser tries to load it at runtime, the module cannot be resolved, producing the red toast error.

**This does NOT affect native app builds (iOS/Android).** Those use native Google Sign-In plugins and never touch this code path.

## Root Cause

In `vite.config.ts`, `@lovable.dev/cloud-auth-js` is listed in `build.rollupOptions.external`. This was done to prevent build errors, but it means the module is not bundled and the browser cannot resolve it at runtime.

## Fix

**Remove `@lovable.dev/cloud-auth-js` from the externals list** in `vite.config.ts` so it gets bundled into the production build. The package is already installed as a dependency — it just needs to be included in the bundle.

### File: `vite.config.ts`

Change the external array from:
```
external: ["@capacitor/filesystem", "@lovable.dev/cloud-auth-js", "@deldev/capacitor-google-auth", "@capacitor/app"]
```
to:
```
external: ["@capacitor/filesystem", "@deldev/capacitor-google-auth", "@capacitor/app"]
```

This single change will fix web Google Sign-In while keeping the Capacitor-only packages correctly externalized.

## Impact

- Web Google Sign-In will work again
- No effect on native iOS/Android builds
- Email/password auth is unaffected (already works)

