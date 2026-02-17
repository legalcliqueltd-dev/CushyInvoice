

## Fix: Google OAuth Redirecting to lovable.app Instead of Custom Domain

### Root Cause

The code is correct -- it sets `redirectTo: "https://cushyinvoice.com/auth"`. However, the **backend authentication settings** (Site URL and Redirect URLs) still point to `cushyinvoice.lovable.app`. When Supabase receives a `redirectTo` URL that is not in its allowlist, it silently ignores it and falls back to the default Site URL (`cushyinvoice.lovable.app`).

This is a **two-part fix**: one backend configuration change and one small code consistency fix.

---

### Fix 1: Update Backend Auth Configuration (Required)

You need to update two settings in your Lovable Cloud authentication config:

1. Open your project's backend settings
2. Go to **Users -> Authentication Settings**
3. Set **Site URL** to: `https://cushyinvoice.com`
4. Under **Redirect URLs**, add: `https://cushyinvoice.com/**`
   - Keep `https://cushyinvoice.lovable.app/**` as well (for preview testing)

Without this, Supabase will keep ignoring the `redirectTo` parameter and falling back to the lovable.app domain.

---

### Fix 2: Use APP_DOMAIN Consistently in Code

**File: `src/pages/Auth.tsx`, line 313**

The custom domain branch still uses `window.location.origin` instead of `APP_DOMAIN`. While they resolve to the same value on cushyinvoice.com, using the constant is safer and consistent with the other branches.

Change:
```
redirectTo: `${window.location.origin}/auth`,
```
To:
```
redirectTo: `${APP_DOMAIN}/auth`,
```

---

### Summary

| What | Change |
|------|--------|
| Backend Auth Settings | Set Site URL to `https://cushyinvoice.com` and add `https://cushyinvoice.com/**` to Redirect URLs |
| `src/pages/Auth.tsx` line 313 | Change `window.location.origin` to `APP_DOMAIN` for consistency |

The backend config change is the critical fix. Without it, no code change will solve the redirect problem.

