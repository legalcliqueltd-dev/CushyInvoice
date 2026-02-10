

# Fix: Select.Item Empty Value Crash

## Problem

The native app crashes with the error: **"A Select.Item must have a value prop that is not an empty string."**

This is caused by line 837 in `src/pages/InvoiceNew.tsx`:

```tsx
<SelectItem value="">None</SelectItem>
```

Radix UI's Select component does not allow empty strings as values because empty string is reserved for clearing the selection.

## Fix

Change the empty string value to a meaningful placeholder like `"none"`, and update the logic that reads this value to treat `"none"` the same as no selection.

### File: `src/pages/InvoiceNew.tsx`

- Change `<SelectItem value="">None</SelectItem>` to `<SelectItem value="none">None</SelectItem>`
- Update any code that checks for the template selection value to treat `"none"` the same as empty/no template selected

