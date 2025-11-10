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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Handle subscription events
    if (event.type === 'customer.subscription.created' || 
        event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      console.log('Subscription event:', { 
        subscriptionId: subscription.id, 
        status: subscription.status,
        customerId 
      });

      // Get customer email
      const customer = await stripe.customers.retrieve(customerId);
      const customerEmail = (customer as Stripe.Customer).email;

      if (!customerEmail) {
        console.error('No customer email found');
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      // Get user from Supabase by email
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      if (usersError) {
        console.error('Error listing users:', usersError);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const user = users.find(u => u.email === customerEmail);
      if (!user) {
        console.error('User not found for email:', customerEmail);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      // Determine plan from price ID
      const priceId = subscription.items.data[0].price.id;
      let currentPlan = null;
      if (priceId === 'price_1SRxiBDjurOQIWXOB9mPYt6n') {
        currentPlan = 'monthly';
      } else if (priceId === 'price_1SRxiTDjurOQIWXOiRxfdxhj') {
        currentPlan = 'yearly';
      }

      const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;

      // Update user profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_status: subscription.status === 'active' ? 'active' : subscription.status === 'trialing' ? 'trialing' : 'inactive',
          current_plan: currentPlan,
          subscription_expiry: subscriptionEnd,
          trial_end_date: trialEnd,
          stripe_customer_id: customerId
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
      } else {
        console.log('Profile updated successfully for user:', user.id);
      }
    }

    // Handle subscription cancellation
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      console.log('Subscription deleted:', { subscriptionId: subscription.id, customerId });

      // Get customer email
      const customer = await stripe.customers.retrieve(customerId);
      const customerEmail = (customer as Stripe.Customer).email;

      if (!customerEmail) {
        console.error('No customer email found');
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      // Get user from Supabase by email
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      if (usersError) {
        console.error('Error listing users:', usersError);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const user = users.find(u => u.email === customerEmail);
      if (!user) {
        console.error('User not found for email:', customerEmail);
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      // Update user profile to canceled
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'canceled',
          current_plan: null,
          subscription_expiry: null
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
      } else {
        console.log('Profile updated to canceled for user:', user.id);
      }
    }

    // Handle invoice payment events (existing functionality)
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const invoiceId = session.metadata?.invoice_id;
      
      // Only process if this is an invoice payment (has invoice_id in metadata)
      if (invoiceId) {
        console.log('Processing invoice payment for invoice:', invoiceId);

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
      } else {
        // This is a subscription checkout, no invoice_id
        console.log('Subscription checkout completed');
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An error occurred' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
