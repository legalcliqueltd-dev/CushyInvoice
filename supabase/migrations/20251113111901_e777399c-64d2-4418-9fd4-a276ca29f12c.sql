-- Function to increment invoice count for free users
CREATE OR REPLACE FUNCTION public.increment_invoice_count(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET invoices_this_month = COALESCE(invoices_this_month, 0) + 1
  WHERE id = user_id AND is_premium = false;
END;
$$;