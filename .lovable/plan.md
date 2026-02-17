

## Fix: Force Google OAuth Redirect to Custom Domain

### Problem
Line 328 in `src/pages/Auth.tsx` still uses `window.location.origin + '/auth'` for the Lovable-managed OAuth branch. When the user is on `cushyinvoice.lovable.app`, this resolves to `https://cushyinvoice.lovable.app/auth`, so Google redirects back there instead of `cushyinvoice.com`.

### Solution
One single change: replace `window.location.origin + '/auth'` with `APP_DOMAIN + '/auth'` on line 328.

`APP_DOMAIN` is already defined at the top of the file as `"https://cushyinvoice.com"`.

### Technical Details

**File: `src/pages/Auth.tsx`, line 328**

```
// FROM:
redirect_uri: window.location.origin + '/auth',

// TO:
redirect_uri: APP_DOMAIN + '/auth',
```

This ensures that regardless of which domain the user starts from (preview, published lovable.app, or custom domain), Google always redirects back to `https://cushyinvoice.com/auth`.

After this change, you will need to **Publish** for it to take effect on the live site.

