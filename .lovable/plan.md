
Issue restatement:
- iOS now returns to the app, but auth state is not being established, so the app lands back on login.
- I checked the code and recent backend auth logs: OAuth callback succeeds server-side (`/callback 302` + login event), but the app-side session handoff is unreliable.

Likely root causes (combined):
1) iOS native Google init is using the Android/web client ID in `Auth.tsx`, so native iOS sign-in can fail and force browser fallback.
2) Browser fallback uses `/auth/mobile-callback` (React route). That route loads the full app bundle before deep-link handoff, which can consume/alter callback params before they are forwarded.
3) Deep-link processing is only mounted in `Auth.tsx`, so callback handling can race/miss depending on app state (cold/warm start).

Implementation plan:

1. Move deep-link OAuth handling to app-level (always mounted)
- Create a small global bridge component (inside router) that:
  - listens to `App.addListener("appUrlOpen")`
  - runs `App.getLaunchUrl()` on startup
  - parses OAuth callback URL and sets session (`exchangeCodeForSession` or `setSession`)
- Remove this listener logic from `Auth.tsx` to avoid route-dependent races.

2. Fix iOS native Google client configuration
- In `src/pages/Auth.tsx`, choose Google client ID by platform:
  - iOS: `261698725488-qsbo20fl2qi11frd50aab93f0r39lckn.apps.googleusercontent.com`
  - Android: keep existing web/server client ID currently used
- Keep `signInWithIdToken` path as primary on native success.

3. Replace SPA callback bridge with static callback file
- Add a static file in `public/` (e.g. `public/auth-mobile-callback.html`) that:
  - reads both query + hash params
  - immediately redirects to `cushyinvoice://auth/callback?...`
  - includes a manual “Open app” button fallback
- Update iOS browser fallback `redirectTo` in `Auth.tsx` to this static file instead of `/auth/mobile-callback`.
- Keep existing React `MobileAuthCallback` route as legacy fallback, but stop using it as primary.

4. Harden callback parsing
- In the global deep-link handler:
  - handle both `code` and token flows from query/hash
  - sanitize malformed iOS code edge-cases (trailing `#` / `%23`)
  - add explicit user-facing error toast when callback is received but session creation fails (currently swallowed)
  - on successful session set/exchange, navigate with `replace` to `/dashboard`.

5. iOS config consistency check in repo
- Ensure `ios/App/App.xcodeproj/project.pbxproj` bundle ID is consistent with `com.cushyinvoice.app` (Debug + Release), matching the iOS OAuth client.
- Keep `Info.plist` URL schemes as already configured (`cushyinvoice` and reversed Google iOS client ID).

Technical details (files to touch):
- `src/pages/Auth.tsx` (platform-specific client IDs, fallback redirect URL)
- `src/App.tsx` + new small bridge component file (global appUrlOpen/getLaunchUrl handler)
- `public/auth-mobile-callback.html` (new static OAuth handoff page)
- `src/pages/MobileAuthCallback.tsx` (optional downgrade to backup-only)
- `ios/App/App.xcodeproj/project.pbxproj` (bundle identifier consistency)

Validation checklist after implementation:
1) iOS physical device: Google sign-in → app reopens → lands on dashboard.
2) Test both warm-start and cold-start app return.
3) Test manual “Open app” button path.
4) Confirm no loop back to `/auth`.
5) Confirm backend auth log shows callback success and app session established immediately after return.
