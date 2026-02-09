
# Mobile App & Feature Enhancements Plan

## Overview
Four improvements: (1) fix post-auth redirect to stay in-app, (2) add forgot password flow, (3) logo background container with color picker, and (4) template selector on invoice creation page.

---

## 1. Fix Post-Auth Redirect for Native App

**Problem**: After logging in within the Capacitor app, the webview navigates but may open external browser windows (especially Google OAuth). The app should stay within the webview after authentication.

**Changes**:
- In `src/pages/Auth.tsx`, update the Google OAuth `redirectTo` to use the custom domain explicitly: `https://cushyinvoice.com/auth`
- Add detection for Capacitor environment using `window.Capacitor` to ensure navigation stays in-app
- The email/password login already navigates via `react-router` so it stays in-app naturally
- For signup `emailRedirectTo`, also set to `https://cushyinvoice.com/dashboard`

---

## 2. Forgot Password Feature

**Changes to `src/pages/Auth.tsx`**:
- Add a "Forgot password?" link below the password field (visible only on login mode)
- Add a new state `isForgotPassword` to toggle a password reset form
- The reset form shows only an email field and calls `supabase.auth.resetPasswordForEmail()` with `redirectTo: https://cushyinvoice.com/auth/reset`
- Show success message: "Check your email for a password reset link"

**New file: `src/pages/ResetPassword.tsx`**:
- A page at `/auth/reset` that reads the token from URL
- Shows a form with "New Password" and "Confirm Password" fields
- Calls `supabase.auth.updateUser({ password })` to set the new password
- On success, redirects to `/dashboard`

**Route addition in `src/App.tsx`**:
- Add route for `/auth/reset` pointing to `ResetPassword` page

---

## 3. Logo Background Container

**Problem**: Logos currently display without a dedicated background, which can look inconsistent on invoices.

**Changes to `src/pages/InvoiceNew.tsx`**:
- Wrap the logo preview in a square container with rounded corners (`rounded-xl`)
- Default background color: white (`#ffffff`)
- Add a small color picker input next to the logo to let users change the background color
- Store the selected `logo_bg_color` in state (default: `#ffffff`)
- Pass `logo_bg_color` through to the invoice save and PDF generation

**Changes to `src/lib/generateInvoicePdf.ts`**:
- Before drawing the logo image, draw a filled rounded rectangle behind it using the chosen background color
- This ensures the PDF also shows the logo with its colored background container

**Changes to `src/pages/InvoiceDetail.tsx`**:
- Display the logo with the same rounded background container when viewing an invoice

**Database**: Add `logo_bg_color` column to the `invoices` table (VARCHAR, default `#ffffff`, nullable) so each invoice can store its logo background color preference.

---

## 4. Template Selector on Invoice Creation

**Current state**: Templates are already fetched and shown in a dropdown on the create invoice page, but only when the user has custom templates (`templates.length > 0`).

**Changes to `src/pages/InvoiceNew.tsx`**:
- Always show the template selector (not conditionally on `templates.length > 0`)
- Include the 4 built-in default templates (Modern, Classic, Minimal, Bold) alongside any custom user templates in the dropdown
- Group templates: "Default Templates" section and "Your Templates" section in the Select dropdown
- When a built-in template is selected, apply its style settings (color, layout) to the invoice
- Remove the condition that hides the template selector when no custom templates exist

---

## Technical Details

### Files to modify
1. **`src/pages/Auth.tsx`** -- Add forgot password link/flow, fix OAuth redirectTo for native app
2. **`src/pages/InvoiceNew.tsx`** -- Logo background container with color picker, always-visible template selector with default templates
3. **`src/lib/generateInvoicePdf.ts`** -- Draw rounded colored background behind logo in PDF
4. **`src/pages/InvoiceDetail.tsx`** -- Show logo with background container
5. **`src/App.tsx`** -- Add `/auth/reset` route
6. **`src/components/LogoUploadDialog.tsx`** -- No changes needed (logo upload itself is fine)

### Files to create
1. **`src/pages/ResetPassword.tsx`** -- Password reset page with new password form

### Database migration
- Add `logo_bg_color` column (VARCHAR, default '#ffffff') to `invoices` table
