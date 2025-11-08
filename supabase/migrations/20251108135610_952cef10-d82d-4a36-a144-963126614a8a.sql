-- Add currency column to invoices table
ALTER TABLE public.invoices 
ADD COLUMN currency text NOT NULL DEFAULT 'USD';