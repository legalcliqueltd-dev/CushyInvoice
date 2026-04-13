import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Only these emails can use the test payment endpoint
const ALLOWED_TEST_EMAILS = ["akebinary@gmail.com"];

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    if (!ALLOWED_TEST_EMAILS.includes(user.email)) {
      throw new Error("Not authorized for test payments");
    }

    // Grant 24-hour premium access for testing
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    await supabaseClient
      .from('profiles')
      .update({
        is_premium: true,
        plan_type: 'premium',
        subscription_status: 'active',
        current_plan: 'monthly',
        subscription_expiry: expiry.toISOString(),
        trial_end_date: null,
      })
      .eq('id', user.id);

    return new Response(JSON.stringify({
      success: true,
      message: "Test premium activated for 24 hours",
      expires: expiry.toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
