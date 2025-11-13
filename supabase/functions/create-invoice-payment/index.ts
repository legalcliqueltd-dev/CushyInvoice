import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-INVOICE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const { invoiceId } = await req.json();
    if (!invoiceId) throw new Error("Invoice ID is required");
    logStep("Invoice ID received", { invoiceId });

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .select(`
        *,
        clients(name, email),
        profiles(company_name)
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError) throw invoiceError;
    if (!invoice) throw new Error("Invoice not found");
    
    logStep("Invoice retrieved", { invoiceNumber: invoice.invoice_number });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-11-20.acacia" });

    // Create or find customer
    let customerId;
    if (invoice.clients?.email) {
      const customers = await stripe.customers.list({ 
        email: invoice.clients.email, 
        limit: 1 
      });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing customer", { customerId });
      } else {
        const customer = await stripe.customers.create({
          email: invoice.clients.email,
          name: invoice.clients.name,
        });
        customerId = customer.id;
        logStep("Created new customer", { customerId });
      }
    }

    const origin = req.headers.get("origin") || Deno.env.get("SUPABASE_URL") || "http://localhost:3000";
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : invoice.clients?.email,
      line_items: [
        {
          price_data: {
            currency: invoice.currency.toLowerCase(),
            product_data: {
              name: `Invoice ${invoice.invoice_number}`,
              description: `From ${invoice.profiles?.company_name || 'Invoice'}`,
            },
            unit_amount: Math.round(invoice.total * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/payment-success?invoice_id=${invoiceId}`,
      cancel_url: `${origin}/invoices/${invoiceId}`,
      metadata: {
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // Update invoice with payment link
    await supabaseClient
      .from("invoices")
      .update({ 
        payment_link: session.url,
        stripe_session_id: session.id 
      })
      .eq("id", invoiceId);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-invoice-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
