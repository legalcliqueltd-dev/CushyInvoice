

# Fix: "Invalid time value" Crash Preventing Paid Users From Being Recognized

## Root Cause
Both the **stripe-webhook** and **check-subscription** edge functions are crashing with `"Invalid time value"` when calling `new Date(subscription.current_period_end * 1000).toISOString()`.

The Stripe API returns `current_period_end` and `trial_end` as Unix timestamps (seconds), but the value being received may already be in a different format depending on the Stripe SDK version. The `* 1000` multiplication on an unexpected value produces an invalid Date, which crashes `.toISOString()`.

This means:
- The webhook received the user's `customer.subscription.created` event but **crashed before updating the database**
- The check-subscription function also crashes every call, so even periodic checks fail
- The user's profile remains: `is_premium: false`, `plan_type: free`, `stripe_customer_id: null`

## Fix

### 1. Add safe date conversion helper to both edge functions

Replace raw `new Date(value * 1000).toISOString()` calls with a safe helper:

```typescript
const safeTimestampToISO = (timestamp: any): string | null => {
  if (!timestamp) return null;
  // If it's already a string (ISO date), return as-is
  if (typeof timestamp === 'string') return timestamp;
  // If it's a number, treat as Unix seconds
  const ms = typeof timestamp === 'number' ? timestamp * 1000 : NaN;
  const date = new Date(ms);
  return isNaN(date.getTime()) ? null : date.toISOString();
};
```

### 2. Update `supabase/functions/stripe-webhook/index.ts`
- Add the `safeTimestampToISO` helper
- Line 80: Change `new Date(subscription.current_period_end * 1000).toISOString()` to `safeTimestampToISO(subscription.current_period_end)`
- Line 81: Change the `trial_end` conversion similarly
- Also add `is_premium: true` and `plan_type: 'premium'` to the profile update for active/trialing subscriptions (currently missing from the created/updated handler)

### 3. Update `supabase/functions/check-subscription/index.ts`
- Add the same `safeTimestampToISO` helper
- Line 108: Change `new Date(subscription.current_period_end * 1000).toISOString()` to `safeTimestampToISO(subscription.current_period_end)`
- Line 109: Change the `trial_end` conversion similarly

### 4. Fix the user's profile data immediately
Run a database update to set the correct subscription data for user `fe8ab737-d7e6-4885-b947-3b0ce1632589`:
- `is_premium: true`
- `plan_type: 'premium'`
- `subscription_status: 'trialing'`
- `stripe_customer_id: 'cus_TwpoCXUkxt68hw'`
- `current_plan: 'monthly'` (based on the subscription's price ID)

### 5. Redeploy both edge functions

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/stripe-webhook/index.ts` | Safe date conversion, add is_premium/plan_type on subscription create/update |
| `supabase/functions/check-subscription/index.ts` | Safe date conversion |
| Database | Fix gobeth.ltd@gmail.com profile to reflect active subscription |

