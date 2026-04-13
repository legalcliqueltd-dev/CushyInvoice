-- Drop anon SELECT policies added for pay-invoice feature
DROP POLICY IF EXISTS "Anyone can view invoice by id for payment" ON public.invoices;
DROP POLICY IF EXISTS "Anyone can view invoice items for payment" ON public.invoice_items;
DROP POLICY IF EXISTS "Anyone can view client for payment" ON public.clients;