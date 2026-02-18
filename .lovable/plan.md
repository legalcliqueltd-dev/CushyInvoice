
# Invoice Sharing and Account Details Improvements

## Overview
This plan addresses four changes: making lock icons blue, redirecting locked actions to the payment page, ensuring PDF generation before sharing for paid users, and adding optional bank account details to the invoice creation form.

---

## 1. Blue Lock Icons + Redirect to Payment Page

**Files to change:** `src/pages/InvoiceDetail.tsx`, `src/components/ShareInvoiceDialog.tsx`

### InvoiceDetail.tsx
- Change the Lock icon on the Download button to use `className="h-4 w-4 mr-1 text-blue-500"` instead of the default color.
- The download button already redirects to `/subscribe` when `!isActive` -- this is already working.

### ShareInvoiceDialog.tsx
- Change the Lock icon color to blue: `className="h-4 w-4 mr-2 text-blue-500"`
- Update `handleOpenChange` so that when `locked` is true and user clicks, it navigates to `/subscribe` instead of just showing a toast. This requires passing `navigate` from react-router-dom (either via props or using `useNavigate` inside the dialog).

---

## 2. PDF-First Sharing for Paid Users

The current sharing flow already generates a PDF before sharing for WhatsApp, Email, and Native Share. The Download button also already generates a PDF. This is working correctly. No changes needed here -- the existing implementation in `ShareInvoiceDialog.tsx` already calls `generateInvoicePdf()` before each sharing action.

---

## 3. Optional Account Details in Invoice Form

**Files to change:** `src/pages/InvoiceNew.tsx`

The Settings page already has bank details fields (bank name, account number, routing code). The invoice form does not currently have these fields.

### Changes:
- Add state variables for bank details: `bankName`, `bankAccountNumber`, `bankRoutingCode`, and a `showBankDetails` toggle (checkbox or switch).
- Fetch bank details from the profile in `fetchProfileDefaults` (add `bank_name, bank_account_number, bank_routing_code` to the select query) and pre-fill the state.
- Add a collapsible "Account Details" section in the invoice form with:
  - A Switch/Checkbox labeled "Include account details on invoice"
  - Bank Name, Account Number, and Routing/Sort Code fields (only shown when toggled on)
- Pass the bank details to `InvoicePreview` so they show in the preview tab.
- Save these values with the invoice (this may require adding columns to the `invoices` table, or we can rely on the profile-level bank details which are already used in PDF generation).

### Database consideration:
The bank details are already stored at the profile level and the PDF generation (`generateInvoicePdf`) and `InvoicePreview` component already use them from the profile. Adding a toggle per invoice to "include bank details" would require a new boolean column `include_bank_details` on the `invoices` table.

### Migration:
- Add `include_bank_details` boolean column (default `false`) to the `invoices` table.

---

## Technical Summary

| File | Changes |
|------|---------|
| `src/pages/InvoiceDetail.tsx` | Blue lock icon color on download button |
| `src/components/ShareInvoiceDialog.tsx` | Blue lock icon, redirect to `/subscribe` on click, add `useNavigate` |
| `src/pages/InvoiceNew.tsx` | Add bank details toggle + fields, fetch bank info from profile, pass to preview |
| `supabase/migrations/` | Add `include_bank_details` column to `invoices` table |
| `src/components/InvoicePreview.tsx` | Accept and conditionally render bank details based on toggle |
| `src/lib/generateInvoicePdf.ts` | Conditionally include bank details in PDF based on the toggle |
