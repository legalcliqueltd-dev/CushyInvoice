-- Allow anonymous/public read access to invoices for the pay page
CREATE POLICY "Anyone can view invoice by id for payment"
ON public.invoices
FOR SELECT
TO anon
USING (true);

-- Allow anonymous read access to invoice items for the pay page
CREATE POLICY "Anyone can view invoice items for payment"
ON public.invoice_items
FOR SELECT
TO anon
USING (true);

-- Allow anonymous read access to clients for the pay page (to show client name)
CREATE POLICY "Anyone can view client for payment"
ON public.clients
FOR SELECT
TO anon
USING (true);