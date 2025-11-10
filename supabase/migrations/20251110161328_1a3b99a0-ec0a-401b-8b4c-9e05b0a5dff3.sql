-- Add subscription tracking fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS current_plan TEXT,
ADD COLUMN IF NOT EXISTS subscription_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;