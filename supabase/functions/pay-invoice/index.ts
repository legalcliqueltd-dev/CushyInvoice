import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId } = await req.json();
    if (!invoiceId) throw new Error("invoiceId is required");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch invoice with client info
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .select("*, clients(name, email)")
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) throw new Error("Invoice not found");
    if (invoice.status === "paid") throw new Error("Invoice is already paid");

    // Fetch invoice items
    const { data: items } = await supabaseClient
      .from("invoice_items")
      .select("description, quantity, unit_price, amount")
      .eq("invoice_id", invoiceId);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Build line items from invoice items
    const lineItems = (items || []).map((item) => ({
      price_data: {
        currency: invoice.currency.toLowerCase(),
        product_data: {
          name: item.description,
        },
        unit_amount: Math.round(item.unit_price * 100),
      },
      quantity: item.quantity,
    }));

    // Add tax as a separate line item if present
    if (invoice.tax_amount && invoice.tax_amount > 0) {
      lineItems.push({
        price_data: {
          currency: invoice.currency.toLowerCase(),
          product_data: {
            name: `Tax (${invoice.tax_rate || 0}%)`,
          },
          unit_amount: Math.round(invoice.tax_amount * 100),
        },
        quantity: 1,
      });
    }

    const origin = req.headers.get("origin") || "https://cushyinvoice.lovable.app";

    // Create Stripe Checkout session — Apple Pay is automatically available
    // when enabled in the Stripe Dashboard under Payment Methods
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/payment-success?invoiceId=${invoiceId}`,
      cancel_url: `${origin}/pay/${invoiceId}?canceled=true`,
      customer_email: invoice.clients?.email || undefined,
      metadata: {
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
      },
      payment_intent_data: {
        metadata: {
          invoice_id: invoiceId,
          invoice_number: invoice.invoice_number,
        },
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[PAY-INVOICE] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
