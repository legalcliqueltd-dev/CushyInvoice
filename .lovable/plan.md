

# Plan: Add Tester Whitelist for Free Access

## Overview
Create a `tester_emails` database table and update the `check-subscription` edge function to grant free premium access to whitelisted tester emails. This lets your Google Play testers use the app without needing a paid subscription.

## Steps

### 1. Create `tester_emails` table (migration)
```sql
CREATE TABLE public.tester_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  added_at timestamptz DEFAULT now(),
  notes text
);
ALTER TABLE public.tester_emails ENABLE ROW LEVEL SECURITY;
-- No RLS policies needed — only accessed via service role in edge function
```

### 2. Update `check-subscription` edge function
Add an early check at the top of the function (after user authentication):
- Query `tester_emails` table for the user's email using the service role client
- If found, immediately return `{ subscribed: true, status: 'active', plan_type: 'tester', is_premium: true }` — bypassing all Stripe/Paystack checks

### 3. Populate the table with tester emails
Use the data insert tool to add your 12+ tester email addresses to the `tester_emails` table.

## What this achieves
- Testers get full premium access without paying
- No code changes needed on the frontend — the existing `useSubscription` hook will see them as subscribed
- Easy to manage: add/remove testers by inserting/deleting rows in the table
- Zero impact on paying users' flow

