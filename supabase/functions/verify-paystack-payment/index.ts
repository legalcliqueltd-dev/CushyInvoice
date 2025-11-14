import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYSTACK-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    const { reference } = await req.json();
    if (!reference) throw new Error("Payment reference is required");
    logStep("Verifying payment reference", { reference });

    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) throw new Error("PAYSTACK_SECRET_KEY is not set");

    // Verify transaction with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
    });

    const verifyData = await verifyResponse.json();
    logStep("Paystack verification response", verifyData);

    if (!verifyData.status) {
      throw new Error(verifyData.message || "Failed to verify payment");
    }

    const transaction = verifyData.data;
    
    // Check if payment was successful
    if (transaction.status !== "success") {
      return new Response(JSON.stringify({
        verified: false,
        status: transaction.status,
        message: "Payment was not successful",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Update user subscription status in profiles table
    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({
        is_premium: true,
        plan_type: transaction.metadata.plan_id || "monthly",
        subscription_status: "active",
        paystack_customer_code: transaction.customer.customer_code,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      logStep("Error updating profile", updateError);
      throw new Error("Failed to update subscription status");
    }

    logStep("Payment verified and subscription activated", {
      userId: user.id,
      amount: transaction.amount / 100,
      reference: transaction.reference,
    });

    return new Response(JSON.stringify({
      verified: true,
      status: transaction.status,
      amount: transaction.amount / 100,
      currency: transaction.currency,
      paid_at: transaction.paid_at,
      plan_id: transaction.metadata.plan_id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
