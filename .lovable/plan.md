

## Update Capacitor App ID

**File: `capacitor.config.ts`**

Change `appId` from `app.lovable.e23699a8f80e4b9dbb96d8d50a1c74ed` to `com.cushyinvoice.app`.

### After deployment
1. Pull latest changes
2. Run `npx cap sync ios`
3. Verify Bundle Identifier in Xcode matches `com.cushyinvoice.app`
4. Ensure signing succeeds

> **Note:** Your iOS OAuth Client ID in Google Cloud Console must also use `com.cushyinvoice.app` as the bundle ID.

