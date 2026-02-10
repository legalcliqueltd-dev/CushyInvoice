

# Fix: React Error #310 - Hook Called Inside JSX

## Root Cause

In `src/pages/Invoices.tsx` at line 243, the `useIsMobile()` hook is called **inside JSX** (inside a conditional render expression):

```tsx
{useIsMobile() && (
  <button ...>
```

React hooks must be called at the **top level** of a component function, never inside JSX, conditionals, or loops. This causes the number of hooks to change between renders, triggering React Error #310: "Rendered more hooks than during the previous render."

## Fix

Move the `useIsMobile()` call to the top of the component alongside the other hooks:

```tsx
export default function Invoices() {
  const isMobile = useIsMobile();       // <-- add here
  const [invoices, setInvoices] = ...
  ...
```

Then update line 243 to use the variable instead of calling the hook:

```tsx
{isMobile && (
  <button ...>
```

This is a one-file, two-line fix in `src/pages/Invoices.tsx`. After this change, push to GitHub so the Hostinger deployment picks it up and the native app will work.

