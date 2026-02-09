

# Unlock All Features for Paid Users, Remove Popups, Fix Subscription Logic

## Current User Breakdown

| Status | Count | Details |
|--------|-------|---------|
| Free users | 3 | plan_type=free, not premium |
| Active trial users | 2 | plan_type=trial, currently premium |
| Expired trial (stuck) | 1 | plan_type=trial but is_premium=false |
| Canceled but still "premium" | 1 | plan_type=premium, is_premium=true, status=canceled -- this is a bug |
| Actively paying users | 0 | No active Stripe subscriptions found |

## Issues Found

1. **Payment Reminder popup** still exists on InvoiceDetail -- needs removal
2. **SubscriptionGuard** blocks Recurring Invoices, Templates (custom creation) for non-premium users
3. **Expenses page** has its own premium gate using `usePlanLimits` -- blocks the entire page
4. **Dashboard** shows TrialBanner, UpgradeBanner, PlanLimitsBanner, and AdSense ads to non-premium users
5. **Sidebar** shows Crown badges on Recurring, Expenses, Templates nav items
6. **Canceled user bug**: 1 user has subscription_status=canceled but is_premium=true -- the webhook should have fixed this
7. **check-subscription edge function** correctly syncs Stripe status, but the webhook doesn't update `is_premium` and `plan_type` on cancellation

## Plan

### 1. Remove Payment Reminder Dialog from InvoiceDetail
**File: `src/pages/InvoiceDetail.tsx`**
- Remove the `import { AddPaymentReminderDialog }` line
- Remove the `<AddPaymentReminderDialog>` component from the action buttons (line 282)

### 2. Remove All Premium Gates -- Make Every Feature Open to Paid Users
**File: `src/pages/RecurringInvoices.tsx`**
- Remove the `<SubscriptionGuard>` wrapper so recurring invoices page content renders for everyone
- Keep the import cleanup

**File: `src/pages/Templates.tsx`**
- Remove both `<SubscriptionGuard>` usages (lines 97-107 and 168-170)
- Allow all users to create custom templates

**File: `src/pages/Expenses.tsx`**
- Remove the `usePlanLimits` import and the premium gate block (lines 108-129)
- Always fetch expenses regardless of plan status
- Remove the `limits.isPremium` check in useEffect (lines 42-47)

### 3. Hide Banners and Ads for Paid Users on Dashboard
**File: `src/pages/Dashboard.tsx`**
- Wrap `<TrialBanner />`, `<UpgradeBanner />`, `<PlanLimitsBanner />`, and `<AdSenseAd />` in a condition: only show when `!subscription.subscribed`
- The `useSubscription` hook is already imported

### 4. Remove Crown Badges from Sidebar for Paid Users
**File: `src/components/DashboardLayout.tsx`**
- Import `useSubscription` hook
- When `subscription.subscribed` is true, hide the Crown badge on premium nav items
- Alternatively, remove the `premium: true` flag rendering when subscribed

### 5. Fix Webhook to Properly Update is_premium and plan_type on Cancellation
**File: `supabase/functions/stripe-webhook/index.ts`**
- In the `customer.subscription.deleted` handler, also set `is_premium: false` and `plan_type: 'free'` (currently it only sets `subscription_status: 'canceled'` but leaves `is_premium` and `plan_type` unchanged)

### 6. Fix the Canceled User Data
- Run a data update to fix the 1 user who has `plan_type=premium, is_premium=true` but `subscription_status=canceled` -- set them to `is_premium=false, plan_type='free'`

### 7. Style Consistency for Remaining Dialogs
**Files: `src/components/AddRecurringInvoiceDialog.tsx`, `src/components/AddTemplateDialog.tsx`, `src/components/ShareInvoiceDialog.tsx`, `src/components/AddExpenseDialog.tsx`**
- Apply `neo-card-subtle` border styling to DialogContent
- Apply `neo-btn-subtle` to primary action buttons
- Ensures all dialogs match the subscription page's neobrutalism style

### 8. Update SubscriptionGuard Styling (kept as fallback)
**File: `src/components/SubscriptionGuard.tsx`**
- Apply `neo-card-subtle` and `neo-btn-subtle` classes to the upgrade alert for visual consistency
- This component stays in the codebase for any future use but won't block features currently

## What Does NOT Change
- Landing page
- Subscription/Stripe integration logic (check-subscription, create-subscription-session, customer-portal)
- Routing, data fetching, form submissions
- The `usePlanLimits` hook file itself (stays for potential future use)
- Background colors and core theme

## Summary Table

| File | Change |
|------|--------|
| `src/pages/InvoiceDetail.tsx` | Remove AddPaymentReminderDialog |
| `src/pages/RecurringInvoices.tsx` | Remove SubscriptionGuard wrapper |
| `src/pages/Templates.tsx` | Remove both SubscriptionGuard usages |
| `src/pages/Expenses.tsx` | Remove premium gate, always load expenses |
| `src/pages/Dashboard.tsx` | Conditionally hide banners/ads for paid users |
| `src/components/DashboardLayout.tsx` | Hide Crown badges for subscribed users |
| `src/components/SubscriptionGuard.tsx` | Neo styling update |
| `src/components/AddRecurringInvoiceDialog.tsx` | Neo styling on dialog |
| `src/components/AddTemplateDialog.tsx` | Neo styling on dialog |
| `src/components/ShareInvoiceDialog.tsx` | Neo styling on dialog |
| `src/components/AddExpenseDialog.tsx` | Neo styling on dialog |
| `supabase/functions/stripe-webhook/index.ts` | Fix cancellation to set is_premium=false, plan_type='free' |
| Database | Fix 1 canceled user's is_premium/plan_type |

