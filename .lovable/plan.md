

# Fix: Template UUID Error and Google OAuth Redirect

## Issue 1: Templates - "invalid input syntax for type uuid: builtin-classic"

The template selector offers built-in options (Modern, Classic, Minimal, Bold) with values like `builtin-modern`, `builtin-classic`, etc. When saving the invoice, this value is passed directly to the `template_id` column, which expects a UUID or null. The string `"builtin-classic"` is not a valid UUID, causing the database error.

### Fix

**File: `src/pages/InvoiceNew.tsx`**

1. When saving the invoice, check if the selected template starts with `builtin-`. If so, store `null` in `template_id` but preserve the builtin style name in a separate way.
2. Update the `handleSave` function (around line 503) to treat any `builtin-*` value the same as `"none"` for the `template_id` field -- store `null` instead of the string.
3. The built-in template style information should still be usable for PDF generation without needing a database UUID. We will pass the builtin template name separately when navigating to the invoice detail or generating the PDF.

Concrete change at line 503:
```typescript
// Before:
template_id: selectedTemplateId && selectedTemplateId !== "none" ? selectedTemplateId : null,

// After:
template_id: selectedTemplateId && selectedTemplateId !== "none" && !selectedTemplateId.startsWith("builtin-") ? selectedTemplateId : null,
```

This ensures only real UUIDs (custom user templates) are stored in the database. Built-in template styling will be handled at the PDF generation layer using a convention rather than a database record.

---

## Issue 2: Google OAuth Redirects to Webpage Instead of Back to App

When signing in with Google on the custom domain (`cushyinvoice.com`), the auth-bridge (designed for `*.lovable.app`) intercepts the redirect and sends users to the web preview URL instead of back to the app.

### Fix

**File: `src/pages/Auth.tsx`**

Update the `handleGoogleSignIn` function (line 240-255, the non-Capacitor branch) to detect the custom domain and use `skipBrowserRedirect: true`, then manually redirect to the OAuth URL. This bypasses the auth-bridge.

```typescript
// Detect custom domain (not lovable.app or lovableproject.com)
const isCustomDomain =
  !window.location.hostname.includes("lovable.app") &&
  !window.location.hostname.includes("lovableproject.com");

if (isCustomDomain) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth`,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (data?.url) {
    window.location.href = data.url;
  }
} else {
  // Standard flow for Lovable preview domains
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${APP_DOMAIN}/auth`,
    },
  });
  if (error) throw error;
}
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/pages/InvoiceNew.tsx` | Prevent `builtin-*` strings from being saved as `template_id` (store `null` instead) |
| `src/pages/Auth.tsx` | Add custom domain detection to bypass auth-bridge for Google OAuth |

Both are small, targeted fixes. After implementation, push to GitHub so the Hostinger deployment and native app are updated.

