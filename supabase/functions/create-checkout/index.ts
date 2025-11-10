import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    });

    const { invoiceId } = await req.json();

    if (!invoiceId) {
      throw new Error('Invoice ID is required');
    }

    // Fetch invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        clients(name, email),
        invoice_items(description, quantity, unit_price, amount)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      console.error('Invoice fetch error:', invoiceError);
      throw new Error('Invoice not found');
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      throw new Error('Invoice is already paid');
    }

    // Calculate amount due (considering existing payments)
    const { data: payments } = await supabase
      .from('payments')
      .select('amount')
      .eq('invoice_id', invoiceId);

    const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const amountDue = Number(invoice.total) - totalPaid;

    if (amountDue <= 0) {
      throw new Error('Invoice has no outstanding balance');
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: invoice.invoice_items.map((item: any) => ({
        price_data: {
          currency: invoice.currency.toLowerCase(),
          product_data: {
            name: item.description,
          },
          unit_amount: Math.round(Number(item.unit_price) * 100), // Convert to cents
        },
        quantity: Number(item.quantity),
      })),
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}&invoice_id=${invoiceId}`,
      cancel_url: `${req.headers.get('origin')}/invoices/${invoiceId}`,
      metadata: {
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
      },
      customer_email: invoice.clients.email,
    });

    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
