

## Fix: Always Use Direct Supabase OAuth with Custom Domain Redirect

### Problem
The `lovable.auth.signInWithOAuth` managed OAuth (line 327) is used when on lovable.app domains. Even though we set `redirect_uri: APP_DOMAIN + '/auth'`, the managed flow overrides this and redirects back to the lovable.app domain. This is why existing customers keep landing on `cushyinvoice.lovable.app` instead of `cushyinvoice.com`.

### Solution
Remove the three-way environment branching in `handleGoogleSignIn`. Since CushyInvoice has a custom domain, we should **always** use the direct Supabase OAuth flow with `APP_DOMAIN` as the redirect target -- never the managed Lovable OAuth.

### Technical Details

**File: `src/pages/Auth.tsx`**

Replace the `else` block (lines 325-334) that uses `lovable.auth.signInWithOAuth` with the same direct Supabase OAuth pattern used in the custom domain branch, but pointing to `APP_DOMAIN`:

```typescript
} else {
  // Lovable domain - redirect to custom domain via direct OAuth
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${APP_DOMAIN}/auth`,
      skipBrowserRedirect: true,
    },
  });
  if (error) {
    toast({ title: "Google Sign-In Error", description: error.message, variant: "destructive" });
    setLoading(false);
    return;
  }
  if (data?.url) {
    window.location.href = data.url;
  }
}
```

This ensures that no matter where the user starts (preview, lovable.app, or custom domain), Google always redirects back to `https://cushyinvoice.com/auth`.

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Replace managed `lovable.auth.signInWithOAuth` with direct `supabase.auth.signInWithOAuth` using `APP_DOMAIN` redirect |

After this change, **publish** the site for the fix to take effect.
