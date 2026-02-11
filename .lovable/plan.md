

## Fix Local Build Failure for `@lovable.dev/cloud-auth-js`

### Problem
Running `npm run build` locally fails because Rollup cannot resolve `@lovable.dev/cloud-auth-js` from `src/integrations/lovable/index.ts`. This package is only available in the Lovable Cloud build environment, not in your local `node_modules`.

### Solution
Add `@lovable.dev/cloud-auth-js` to the `build.rollupOptions.external` array in `vite.config.ts`, alongside the already-externalized `@capacitor/filesystem`.

### Technical Details

**File: `vite.config.ts`**

Update the external array:
```text
build: {
  rollupOptions: {
    external: ["@capacitor/filesystem", "@lovable.dev/cloud-auth-js"],
  },
}
```

This tells Vite/Rollup to skip bundling this module, preventing the build error. At runtime on Lovable Cloud, the package is available and works normally. For the Capacitor/iOS build, the Google OAuth on Lovable domains won't be used anyway (it falls into the Capacitor branch), so externalizing it is safe.
