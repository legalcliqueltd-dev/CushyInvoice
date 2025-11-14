-- Add Paystack support to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT;