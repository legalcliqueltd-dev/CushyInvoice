
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS paystack_subscription_code text,
ADD COLUMN IF NOT EXISTS paystack_email_token text;
