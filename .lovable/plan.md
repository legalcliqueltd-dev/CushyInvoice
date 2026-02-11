
# Implementation Plan: 10 Feature Updates for CushyInvoice

This is a large set of changes. To reduce risk and keep things testable, the work is split into 3 phases.

---

## Phase 1: Bug Fixes and UI Polish (Items 1, 5, 7)

### 1. Fix Text Overflow on Mobile
**Problem**: Text and buttons overflow beyond mobile screen borders on multiple pages (Dashboard, Invoices, Clients, Products, etc.)

**Changes**:
- **All table-based pages** (Invoices, Clients, Products): Add `break-words`, `whitespace-normal`, and `min-w-0` to table cells. For very wide tables, ensure the container uses `overflow-x-auto` (already present in Invoices but may need fixes in others).
- **Dashboard**: Add `break-all` or `truncate` to currency values that may overflow on small screens. Wrap stat card content with `min-w-0 overflow-hidden`.
- **InvoiceDetail**: Add `break-words` to description cells and address text.
- **InvoiceNew**: Ensure the line item form inputs don't overflow on mobile by using responsive grid layouts.
- **Global CSS**: Add a utility to prevent any text from exceeding its container.

Files: `src/pages/Invoices.tsx`, `src/pages/Clients.tsx`, `src/pages/Products.tsx`, `src/pages/Dashboard.tsx`, `src/pages/InvoiceDetail.tsx`, `src/pages/InvoiceNew.tsx`, `src/pages/Expenses.tsx`, `src/pages/Reports.tsx`, `src/index.css`

### 5. Fix Shaking Dialog Box
**Problem**: Dialog boxes shake/vibrate when interacting with form fields inside them (likely caused by the global CSS rule `button:active { transform: scale(0.97) }` conflicting with dialog positioning and focus shifts).

**Changes**:
- **`src/index.css`**: Exclude dialog content elements from the `button:active` scale transform.
- **`src/components/ui/dialog.tsx`**: Remove the slide/zoom animations from `DialogContent` that may cause jitter when combined with focus changes. Replace with a simpler fade-in animation.
- **`src/components/AddTemplateDialog.tsx`**: Add `onOpenAutoFocus` handler to prevent auto-focus from causing layout shifts.

Files: `src/index.css`, `src/components/ui/dialog.tsx`, `src/components/AddTemplateDialog.tsx`

### 7. Fix Google OAuth Redirect for Native App
**Problem**: After Google sign-in on the native app, the user stays on the website instead of returning to the app.

**Root Cause**: The Capacitor branch opens a system browser for OAuth, but the redirect URL points to `cushyinvoice.com/auth`, which loads in the browser -- not the app. The app needs a deep link or the in-app browser to close and return.

**Changes**:
- **`src/pages/Auth.tsx`**: For the Capacitor flow, use Capacitor Browser plugin (`@capacitor/browser`) to open the OAuth URL in an in-app browser instead of `window.open`. Listen for the `browserFinished` event to check the session.
- **`capacitor.config.ts`**: Ensure `allowNavigation` includes the auth callback domains.
- Add a URL listener that captures the redirect back from Google and extracts the session tokens.

Files: `src/pages/Auth.tsx`, `capacitor.config.ts`

---

## Phase 2: New Features (Items 2, 3, 4, 6)

### 2. Download PDF to Phone Storage (Capacitor)
**Problem**: PDF downloads don't save visibly to phone storage on Android/iOS.

**Changes**:
- Install `@capacitor/filesystem` plugin.
- **`src/lib/generateInvoicePdf.ts`**: Add a `savePdfToDevice` function that detects Capacitor and uses the Filesystem API to write the blob to the Downloads directory (Android) or Documents (iOS).
- **`src/pages/InvoiceDetail.tsx`**: Update `handleDownloadPdf` to call `savePdfToDevice` on native, and `downloadPdf` on web.

Files: `src/lib/generateInvoicePdf.ts`, `src/pages/InvoiceDetail.tsx`, `package.json`

### 3. Invoice Preview in PDF Format (Tab Switch)
**Problem**: Users can't see what the invoice will look like as a PDF before saving.

**Changes**:
- **`src/pages/InvoiceNew.tsx`**: Add a tab bar at the top with "Edit" and "Preview" tabs.
  - "Edit" shows the current form.
  - "Preview" renders a styled HTML representation of the invoice matching the PDF layout (header with company info, items table, totals, notes).
- Create a new component `src/components/InvoicePreview.tsx` that renders the invoice data in the same visual format as the PDF (matching `generateInvoicePdf.ts` styling).

Files: `src/pages/InvoiceNew.tsx`, `src/components/InvoicePreview.tsx` (new)

### 4. Edit Existing Invoices
**Problem**: Users can't edit an invoice after creating it.

**Changes**:
- **`src/pages/InvoiceDetail.tsx`**: Add an "Edit" button next to "Download".
- Create a new route `/invoices/:id/edit` or reuse `InvoiceNew.tsx` with an edit mode.
- **`src/pages/InvoiceNew.tsx`**: Accept an optional `id` URL parameter. If present, load the existing invoice data and populate the form. On save, use `update` instead of `insert`.
- **`src/App.tsx`**: Add route for `/invoices/:id/edit`.

Files: `src/pages/InvoiceNew.tsx`, `src/pages/InvoiceDetail.tsx`, `src/App.tsx`

### 6. Dark Theme Toggle
**Problem**: No way to switch between light and dark themes.

**Changes**:
- Dark mode CSS variables are already defined in `src/index.css` (the `.dark` class block exists).
- **`src/pages/Settings.tsx`**: Add a theme toggle section with three options: Light, Dark, System.
- **`src/components/DashboardLayout.tsx`**: Add a small theme toggle button (sun/moon icon) in the top bar.
- Create `src/hooks/useTheme.ts`: Manages theme state in localStorage and applies/removes the `dark` class on the `<html>` element. Supports "light", "dark", and "system" modes.
- **`index.html`**: Add a small inline script to prevent flash of wrong theme on load.

Files: `src/hooks/useTheme.ts` (new), `src/pages/Settings.tsx`, `src/components/DashboardLayout.tsx`, `index.html`

---

## Phase 3: Invoice Enhancements (Items 8, 9, 10)

### 8. OTP Email Verification on Signup
**Problem**: Email addresses aren't validated during account creation.

**Changes**:
- Disable auto-confirm for email signups (it should already be disabled based on instructions).
- **`src/pages/Auth.tsx`**: After signup, show an OTP input screen where users enter the 6-digit code sent to their email.
- Use Supabase's built-in `verifyOtp` method with type `signup` to validate the code.
- Add a "Resend OTP" button with a cooldown timer.

Files: `src/pages/Auth.tsx`

### 9. Gradient and Watermark Options for Invoice Templates
**Problem**: Templates don't support gradients or watermarks.

**Changes**:
- **Database migration**: Add columns to `invoice_templates`:
  - `gradient_start_color` (text, nullable)
  - `gradient_end_color` (text, nullable)
  - `gradient_direction` (text, nullable, default 'to-right')
  - `watermark_text` (text, nullable)
  - `watermark_opacity` (numeric, nullable, default 0.1)
- **`src/components/AddTemplateDialog.tsx`**: Add gradient color pickers and a watermark text input.
- **`src/lib/generateInvoicePdf.ts`**: Apply gradient to the PDF header using the template colors. Render watermark text diagonally across the page.
- **`src/components/InvoicePreview.tsx`**: Show gradient/watermark in the preview.

Files: `src/components/AddTemplateDialog.tsx`, `src/lib/generateInvoicePdf.ts`, `src/components/InvoicePreview.tsx`, database migration

### 10. Bank Details on Invoice + UI Improvements
**Problem**: No way to add bank details for payment instructions.

**Changes**:
- **Database migration**: Add columns to `profiles`:
  - `bank_name` (text, nullable)
  - `bank_account_number` (text, nullable)
  - `bank_routing_code` (text, nullable)
  - `show_bank_details` (boolean, default false)
- **`src/pages/Settings.tsx`**: Add a "Bank Details" section where users fill in bank info.
- **`src/pages/InvoiceNew.tsx`**: Add a toggle "Include bank details" that pulls from the profile.
- **`src/lib/generateInvoicePdf.ts`**: Add a "Payment Details" section below the totals with bank info when enabled.
- **UI improvements**: Polish the invoice PDF layout with better spacing, refined typography, and subtle dividers.

Files: `src/pages/Settings.tsx`, `src/pages/InvoiceNew.tsx`, `src/lib/generateInvoicePdf.ts`, database migration

---

## Implementation Order

The work will be done in this order to minimize risk:

1. Phase 1 first (fixes) -- ensures the app is stable
2. Phase 2 (new features) -- adds major functionality
3. Phase 3 (enhancements) -- builds on the new features

Each phase will be implemented and tested before moving to the next.
