-- Add gradient and watermark fields to invoice_templates
ALTER TABLE public.invoice_templates
  ADD COLUMN IF NOT EXISTS gradient_start_color text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gradient_end_color text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gradient_direction text DEFAULT 'to bottom right',
  ADD COLUMN IF NOT EXISTS watermark_text text DEFAULT NULL;

-- Add bank details to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bank_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bank_account_number text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bank_routing_code text DEFAULT NULL;