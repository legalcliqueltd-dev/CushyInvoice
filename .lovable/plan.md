

## Fix: Add `@capacitor/app` to Vite externals

The error says Rollup can't resolve `@capacitor/app` during build. This package is dynamically imported in `Auth.tsx` for deep link handling but only runs in the native Capacitor environment.

### Change

**File: `vite.config.ts`** — Add `@capacitor/app` to the `rollupOptions.external` array:

```
external: [
  "@capacitor/filesystem",
  "@lovable.dev/cloud-auth-js",
  "@deldev/capacitor-google-auth",
  "@capacitor/app"    // ← add this
]
```

That's it. After this change, run `npm run build` again and it should succeed.

