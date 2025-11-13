-- Create enum for plan types
CREATE TYPE public.plan_type AS ENUM ('free', 'trial', 'premium');

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_type public.plan_type DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS invoices_this_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clients_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reset_date TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Update existing users to have trial status if they don't have a subscription
UPDATE public.profiles 
SET plan_type = 'trial',
    trial_end_date = now() + interval '7 days'
WHERE subscription_status = 'inactive' AND trial_end_date IS NULL;

-- Function to reset monthly invoice count
CREATE OR REPLACE FUNCTION public.reset_monthly_invoices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET invoices_this_month = 0,
      last_reset_date = now()
  WHERE last_reset_date < date_trunc('month', now());
END;
$$;

-- Function to check and downgrade expired trials
CREATE OR REPLACE FUNCTION public.check_expired_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET plan_type = 'free',
      is_premium = false
  WHERE plan_type = 'trial' 
    AND trial_end_date < now()
    AND subscription_status != 'active';
END;
$$;