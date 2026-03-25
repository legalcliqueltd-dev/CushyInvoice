
Problem summary
- The app now stalls on the native iOS launch screen after returning from Google login.
- This is a regression likely introduced by startup/auth flow changes, not by Google OAuth credentials themselves.

Do I know what the issue is?
- Yes (high confidence): startup can deadlock on splash because `launchAutoHide` is `false` and `src/main.tsx` uses unsafe plugin access (`window.Capacitor.Plugins`) that can be undefined in Capacitor v8.
- Also likely (secondary): auth/session readiness race can still bounce users back to `/auth` after deep-link return.

Implementation plan

1) Fix startup splash deadlock (highest priority)
- Update `src/main.tsx` to stop using `window.Capacitor.Plugins` destructuring.
- Use safe plugin access/import for Splash Screen and wrap hide in guarded try/catch.
- Add a fail-safe hide path so launch screen is always removed even if first call fails.
- Move any non-critical plugin init out of bootstrap-critical path.

2) Remove bootstrap risk from Google init
- In `src/main.tsx`, remove global Google plugin initialization at app boot.
- Keep Google plugin initialization only inside the sign-in action flow in `src/pages/Auth.tsx` (already present), so app startup is never blocked by auth plugin readiness.

3) Add auth readiness gate to prevent post-login bounce
- Create `src/hooks/useAuthReady.ts`:
  - call `supabase.auth.getSession()` first
  - then subscribe to `supabase.auth.onAuthStateChange`
  - expose `{ user, isReady }`
- Refactor `src/components/ProtectedRoute.tsx` to wait for `isReady` before redirecting to `/auth`.
- Ensure no awaited async work runs directly inside auth-state callback bodies.

4) Harden deep-link handoff completion
- In `src/components/DeepLinkHandler.tsx`, keep code/token parsing but add explicit handling when callback arrives without usable auth params.
- Only navigate to `/dashboard` after confirmed session establishment.
- Add minimal debug logging around received URL + parsing outcome (dev-safe), so cold-start vs warm-start behavior is visible.

5) Keep iOS callback bridge and OAuth redirect stable
- Keep `public/auth-mobile-callback.html` as primary bridge.
- Confirm `src/pages/Auth.tsx` continues using `redirectTo: https://cushyinvoice.com/auth-mobile-callback.html` for mobile browser fallback.
- Keep iOS native client ID and current URL schemes unchanged unless mismatch is found.

6) Verify iOS native config consistency
- Re-check `ios/App/App/Info.plist` URL schemes and `ios/App/App.xcodeproj/project.pbxproj` bundle ID (`com.cushyinvoice.app`) alignment.
- No backend/database changes required for this fix.

Technical files to modify
- `src/main.tsx` (critical startup/splash fix)
- `src/hooks/useAuthReady.ts` (new)
- `src/components/ProtectedRoute.tsx` (auth-ready gating)
- `src/components/DeepLinkHandler.tsx` (callback robustness + diagnostics)
- `src/pages/Auth.tsx` (ensure bootstrap-safe Google flow assumptions)

Validation checklist
1) Launch app normally from home screen: splash disappears every time.
2) iOS Google sign-in (warm start): returns to app and lands on dashboard.
3) iOS Google sign-in (cold start after app kill): returns to app and lands on dashboard.
4) No redirect loop back to `/auth`.
5) Manual fallback button on bridge page still opens the app and completes sign-in.
