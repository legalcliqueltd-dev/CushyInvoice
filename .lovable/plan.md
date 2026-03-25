

## Fix: Native Google Sign-In on iOS (No Browser Redirect)

### Problem
The native `@deldev/capacitor-google-auth` plugin is installed and linked in the iOS project, but the sign-in flow falls back to Safari because:
1. The `initialize()` call passes the **iOS client ID** as `clientId`, but does not pass the **web/server client ID** as `serverClientId`. Without a server client ID, the plugin cannot return an ID token that Supabase can verify.
2. If the plugin's `signIn` method isn't found at runtime (Capacitor v8 plugin registration), the code immediately falls back to browser OAuth without retrying native.

### Plan

**File: `src/pages/Auth.tsx`** — Fix native Google Sign-In initialization for iOS

1. Update the `initialize()` call to pass both the iOS client ID and the web server client ID:
   - `clientId` → iOS client ID (`261698725488-qsbo20fl2qi11frd50aab93f0r39lckn`)
   - `serverClientId` → Web client ID (`261698725488-o5bgnrchhborkjp2gc7nguidc4b3bbma`) — this is what generates the ID token Supabase can verify
   - On Android, keep using the web client ID as `clientId` (current behavior)

2. Before checking `googleAuthPlugin?.signIn`, attempt to load the plugin via dynamic `import("@deldev/capacitor-google-auth")` as a fallback — Capacitor v8 may not register all plugins on `window.Capacitor.Plugins` automatically.

3. Remove the browser fallback as the primary iOS path. Only fall back to browser if the native plugin truly throws a non-recoverable error (not code 10 or cancellation).

4. On successful `signIn()`, extract the ID token and call `supabase.auth.signInWithIdToken()` as currently done — this part is correct.

### Technical Detail

```text
Current iOS flow:
  googleAuthPlugin?.signIn undefined → browser fallback → Safari → bridge page → deep link (broken)

Fixed iOS flow:
  import plugin → initialize(iosClientId, serverClientId) → native account picker → idToken → signInWithIdToken → dashboard
```

No changes needed to `Info.plist`, `Package.swift`, or backend config — the iOS URL scheme and plugin are already correctly set up. The fix is purely in how the JS code initializes and invokes the plugin.

