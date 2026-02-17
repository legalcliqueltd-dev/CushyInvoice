

## Fix OAuth Redirect, Welcome Email, and Remove Lovable/Ad References

### Problem Summary

1. Google OAuth on the lovable.app domain redirects users to `/` (landing page) instead of `/auth`, so `ensureProfileExists` never runs -- meaning no profile is created and no welcome email is sent.
2. The welcome email copy still says "full access to all premium features" instead of reflecting the new trial model.
3. The trial banner says "Your subscription will automatically start" which is misleading -- payment is manual.
4. `index.html` still contains the Google AdSense script tag (ads are removed now).
5. The landing page (Index) has no fallback to redirect authenticated users to the dashboard.

---

### Fix 1: OAuth Redirect URI

**File:** `src/pages/Auth.tsx` (line 328)

Change the Lovable-managed OAuth `redirect_uri` from `window.location.origin` to `window.location.origin + '/auth'`. This ensures users land on the Auth page where the `onAuthStateChange` listener picks up the session, runs `ensureProfileExists`, and redirects to `/dashboard`.

---

### Fix 2: Landing Page Session Guard

**File:** `src/pages/Index.tsx`

Add a `useEffect` that checks for an existing session on mount. If a session exists, redirect immediately to `/dashboard`. This acts as a safety net so no authenticated user gets stuck on the landing page.

---

### Fix 3: Update Welcome Email Copy

**File:** `supabase/functions/send-welcome-email/index.ts` (line 89-91)

Change:
> "You're on a 7-day free trial with full access to all premium features."

To:
> "You're on a 7-day free trial -- create, download, share, and send invoices with no limits. After your trial ends, you'll need to subscribe to keep downloading and sharing invoices."

---

### Fix 4: Fix Trial Banner Copy

**File:** `src/components/TrialBanner.tsx` (line 44)

Change:
> "Your subscription will automatically start after the trial period."

To:
> "Subscribe before it ends to keep downloading and sharing invoices."

---

### Fix 5: Remove AdSense Script from HTML

**File:** `index.html`

Remove the Google AdSense `<script>` tag (lines with `pagead2.googlesyndication.com`). Ads are no longer part of the business model.

---

### Summary of Changes

| File | What Changes |
|------|-------------|
| `src/pages/Auth.tsx` | Change `redirect_uri` to include `/auth` path |
| `src/pages/Index.tsx` | Add session check to redirect authenticated users to dashboard |
| `supabase/functions/send-welcome-email/index.ts` | Update email body for trial-to-paid messaging |
| `src/components/TrialBanner.tsx` | Fix misleading "auto-start" subscription text |
| `index.html` | Remove AdSense script tag |

