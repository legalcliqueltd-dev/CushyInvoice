-- Create email logs table to store generated emails
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('invoice', 'reminder')),
  created_at TIMESTAMPTZ DEFAULT now(),
  sent_manually BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own email logs
CREATE POLICY "Users can view their own email logs"
  ON public.email_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own email logs
CREATE POLICY "Users can insert their own email logs"
  ON public.email_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own email logs
CREATE POLICY "Users can update their own email logs"
  ON public.email_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX idx_email_logs_invoice_id ON public.email_logs(invoice_id);