import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  if (!signature || !webhookSecret) {
    console.error('Missing signature or webhook secret');
    return new Response('Webhook Error: Missing signature', { status: 400 });
  }

  try {
    const body = await req.text();
    
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    console.log('Webhook event received:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const invoiceId = session.metadata?.invoice_id;
      
      if (!invoiceId) {
        console.error('No invoice_id in session metadata');
        return new Response('Missing invoice_id', { status: 400 });
      }

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      // Get invoice details
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('total, user_id')
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        console.error('Invoice not found:', invoiceError);
        return new Response('Invoice not found', { status: 404 });
      }

      // Calculate existing payments
      const { data: existingPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('invoice_id', invoiceId);

      const totalPaid = existingPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const paidAmount = Number(session.amount_total) / 100; // Convert from cents

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoiceId,
          amount: paidAmount,
          payment_method: 'Stripe',
          payment_date: new Date().toISOString().split('T')[0],
          notes: `Stripe Payment - Session: ${session.id}`,
        });

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        return new Response('Error creating payment', { status: 500 });
      }

      // Check if invoice is fully paid
      const newTotalPaid = totalPaid + paidAmount;
      const isFullyPaid = newTotalPaid >= Number(invoice.total);

      // Update invoice status if fully paid
      if (isFullyPaid) {
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ status: 'paid' })
          .eq('id', invoiceId);

        if (updateError) {
          console.error('Error updating invoice status:', updateError);
        } else {
          console.log('Invoice marked as paid:', invoiceId);
        }
      }

      console.log('Payment processed successfully');
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
