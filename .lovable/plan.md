

# Replace CushyInvoice App Icon

## What This Does
Replaces all app icons (favicon, splash screen, and store-ready assets) with your new blue invoice icon.

## Changes

1. Copy the uploaded icon to three locations in the project:
   - `public/app-icon-1024.png` -- high-res version for app store submissions
   - `public/app-icon-512.png` -- Google Play Store required size
   - `public/favicon.png` -- web browser favicon and splash screen icon

2. No code changes needed -- the existing `index.html`, `src/main.tsx`, and `capacitor.config.ts` already reference these file paths.

## After Approval

Once deployed, to update native Android/iOS icons locally:
1. Git pull the latest changes
2. Place the 1024px icon in a `resources/` folder as `icon.png`
3. Run `npx capacitor-assets generate`
4. Run `npx cap sync`

