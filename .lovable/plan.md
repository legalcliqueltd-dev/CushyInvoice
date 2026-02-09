
# Update Capacitor to Use Custom Domain

## Problem
The app on your phone is loading the Lovable login page instead of your CushyInvoice app because the Capacitor configuration points to the Lovable preview URL.

## What Will Change
Update the `capacitor.config.ts` file to use `https://cushyinvoice.com` instead of the current Lovable URL.

## After the Change
Once updated, you will need to:
1. Pull the latest code from GitHub
2. Run `npx cap sync android`
3. Rebuild and run the app in Android Studio

The app on your phone will then load your CushyInvoice website directly.

## Technical Details

**File: `capacitor.config.ts`**
- Change `server.url` from `https://e23699a8-f80e-4b9d-bb96-d8d50a1c74ed.lovableproject.com?forceHideBadge=true` to `https://cushyinvoice.com`
