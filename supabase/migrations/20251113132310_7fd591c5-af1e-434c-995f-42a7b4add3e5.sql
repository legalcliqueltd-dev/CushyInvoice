-- Add payment link fields to invoices table
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS payment_link TEXT,
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;