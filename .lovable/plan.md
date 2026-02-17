

## New Monetization Model: Trial-to-Paid with Feature Gating

### What's Changing

The business model is shifting from an ad-supported freemium to a **7-day free trial then paid** model:

- **No more ads** -- all AdSense code will be removed
- **During trial (7 days):** Full access to everything
- **After trial expires (no payment):** Users can still browse the dashboard and sign in, but **cannot download, share, or screenshot invoices**
- **After payment:** Everything unlocks again

---

### 1. Remove All Ad-Related Code

**Delete file:**
- `src/components/AdSenseAd.tsx`

**Clean up from Dashboard (`src/pages/Dashboard.tsx`):**
- Remove all `AdSenseAd` imports and usages (2 instances)
- Remove the `PlanLimitsBanner` component (no longer relevant -- no free tier limits)
- Remove `UpgradeBanner` and `CompactUpgradeBanner` from the dashboard (replace with a simpler expired-trial banner)

**Files to potentially delete (no longer needed with this model):**
- `src/components/PlanLimitsBanner.tsx` -- free-tier usage limits don't apply
- `src/hooks/usePlanLimits.ts` -- invoice/client count limits removed

---

### 2. Update Subscription Logic

**Simplify the model to 3 states:**
1. **Trial active** (within 7 days) -- full access
2. **Trial expired, not paid** -- restricted (no download/share/screenshot)
3. **Paid subscriber** -- full access

**Update `src/hooks/useSubscription.ts`:**
- Add a computed `isActive` boolean: `true` if subscribed OR trial hasn't expired
- Expose `trialExpired` flag for easy gating

---

### 3. Gate Download, Share, and Screenshot on Invoice Detail

**Update `src/pages/InvoiceDetail.tsx`:**
- Import `useSubscription` hook
- If trial expired and not subscribed:
  - **Download button**: Disabled, shows upgrade prompt on click
  - **Share button (ShareInvoiceDialog)**: Disabled or shows upgrade prompt
  - The invoice preview tab with screenshot capability will show a blur overlay with upgrade CTA
- Edit, view details, and delete remain available

**Update `src/components/ShareInvoiceDialog.tsx`:**
- Accept a `disabled` or `locked` prop
- When locked, clicking the trigger shows a toast/dialog prompting upgrade instead of opening the share options

---

### 4. Add an Expired Trial Banner

**Update `src/components/TrialBanner.tsx`:**
- When trial days > 0: Show "X days left in your trial"
- When trial has expired and user is not subscribed: Show "Your trial has expired. Subscribe to continue downloading and sharing invoices." with an Upgrade button

**Update `src/pages/Dashboard.tsx`:**
- Show only the `TrialBanner` (which now handles both active trial and expired states)
- Remove all ad and limit-related banners

---

### 5. Update Subscribe Page Messaging

**Update `src/pages/Subscribe.tsx`:**
- Remove references to "no ads" in feature lists
- Update features to emphasize: unlimited invoice downloads, sharing, PDF export, email delivery
- Keep the 7-day free trial and pricing as-is

---

### 6. Update PaymentSuccess Page

**Update `src/pages/PaymentSuccess.tsx`:**
- Remove "ad-free experience" from the success message
- Replace with "full access to download, share, and send invoices"

---

### Technical Summary

| File | Action |
|------|--------|
| `src/components/AdSenseAd.tsx` | Delete |
| `src/components/PlanLimitsBanner.tsx` | Delete |
| `src/hooks/usePlanLimits.ts` | Delete (or keep if used elsewhere, but likely unused) |
| `src/hooks/useSubscription.ts` | Add `isActive` and `trialExpired` computed fields |
| `src/pages/Dashboard.tsx` | Remove ads, limit banners; keep simplified TrialBanner |
| `src/components/TrialBanner.tsx` | Handle both active trial and expired trial states |
| `src/components/UpgradeBanner.tsx` | Delete (merged into TrialBanner) |
| `src/components/CompactUpgradeBanner.tsx` | Delete (merged into TrialBanner) |
| `src/pages/InvoiceDetail.tsx` | Gate download/share buttons behind active subscription/trial |
| `src/components/ShareInvoiceDialog.tsx` | Add locked state prop |
| `src/pages/Subscribe.tsx` | Update feature copy |
| `src/pages/PaymentSuccess.tsx` | Update success message |
| `src/components/SubscriptionGuard.tsx` | Keep as-is (may be useful for future gating) |

