

# Fix: Restore Hostinger Domain and Ensure Deployment

## Problem

The Capacitor config currently points to `cushyinvoice.lovable.app`, but you want to use your Hostinger domain `cushyinvoice.com`. The native app error persists because the code on Hostinger hasn't been updated with the latest fixes.

## Changes

### 1. Revert `capacitor.config.ts` back to Hostinger domain

Change `server.url` from `https://cushyinvoice.lovable.app` back to `https://cushyinvoice.com`.

### 2. Add environment variables to GitHub Actions workflow

The build step in `.github/workflows/deploy.yml` is missing the required Supabase environment variables. Without them, the app builds but crashes at runtime with a "supabaseUrl is required" error. We need to pass them during the build step:

```yaml
- name: Build project
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
    VITE_SUPABASE_PROJECT_ID: ${{ secrets.VITE_SUPABASE_PROJECT_ID }}
  run: |
    npm install
    npm run build
    cp .htaccess dist/.htaccess
```

### 3. Verify GitHub secrets are set

You must confirm that these secrets exist in your GitHub repository settings (Settings > Secrets and variables > Actions):

- `FTP_SERVER` -- your Hostinger FTP server
- `FTP_USERNAME` -- your Hostinger FTP username
- `FTP_PASSWORD` -- your Hostinger FTP password
- `VITE_SUPABASE_URL` -- `https://figeuiotixafbnbwgvpi.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` -- the anon key
- `VITE_SUPABASE_PROJECT_ID` -- `figeuiotixafbnbwgvpi`

## After Implementation

Once these changes are pushed to the `main` branch on GitHub:
1. GitHub Actions will build with the correct environment variables and deploy to Hostinger
2. `cushyinvoice.com` will serve the latest code with all fixes
3. Rebuild the native app locally: `git pull` then `npm run build` then `npx cap sync ios`

## Technical Summary

| File | Change |
|------|--------|
| `capacitor.config.ts` | Restore `server.url` to `https://cushyinvoice.com` |
| `.github/workflows/deploy.yml` | Add Supabase env vars to the build step |

