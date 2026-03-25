

## Diagnosis: Multiple Interacting Failures in iOS Google Sign-In

### Issues Found

**Issue 1 — Package.swift references a broken SPM package**
`ios/App/CapApp-SPM/Package.swift` (lines 19, 31) still lists `DeldevCapacitorGoogleAuth` as a dependency. Since the patch script stripped the native iOS source from that package (creating only a stub directory), SPM resolution can fail or produce warnings that break plugin registration for ALL native plugins — including `@capacitor/app`. This is the most likely cause of the `[DeepLink] Failed to init App plugin: {}` error.

**Issue 2 — iOS opens external Safari instead of in-app browser**
`Auth.tsx` lines 192-202 deliberately open the OAuth URL in external Safari on iOS (via anchor tag + `target="_blank"`). External Safari cannot redirect back to the app via a custom URL scheme as reliably as `SFSafariViewController` (used by `@capacitor/browser`). This makes the return-to-app step fragile.

**Issue 3 — No fallback session detection**
If the deep-link listener fails (Issue 1) AND the browser redirect doesn't reopen the app cleanly, there is no fallback. The `Auth.tsx` `onAuthStateChange` listener only fires if Supabase detects a session in the current WebView context — but the OAuth completed in Safari, not the WebView.

### Fix Plan

**1. Remove broken google-auth reference from Package.swift**
Remove lines referencing `DeldevCapacitorGoogleAuth` from both the `dependencies` and `targets` arrays. This package has no valid iOS source. Removing it allows the remaining 4 plugins (including `@capacitor/app`) to build and register correctly.

**2. Use `@capacitor/browser` on iOS instead of external Safari**
Change `openOAuthUrl()` in `Auth.tsx` to use the Browser plugin on ALL platforms (remove the iOS-specific anchor-tag hack). `SFSafariViewController` handles custom URL scheme redirects back to the app more reliably than external Safari.

**3. Add `browserFinished` listener for iOS**
In `DeepLinkHandler.tsx`, add a listener for the Browser plugin's `browserFinished` event. When the in-app browser closes, check if a session was established (via `supabase.auth.getSession()`) and navigate to dashboard if so. This provides a safety net if the `appUrlOpen` event is missed.

**4. Add startup URL fallback in DeepLinkHandler**
On mount, also check `window.location.href` for auth params (`code=`, `access_token=`). This catches edge cases where the WebView itself receives the redirect URL rather than going through the custom scheme.

### Files to Change
- `ios/App/CapApp-SPM/Package.swift` — remove google-auth dependency
- `src/pages/Auth.tsx` — remove iOS external Safari hack in `openOAuthUrl()`
- `src/components/DeepLinkHandler.tsx` — add `browserFinished` listener + startup URL check

