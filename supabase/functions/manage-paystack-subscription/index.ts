import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANAGE-PAYSTACK-SUB] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) throw new Error("PAYSTACK_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    const { action } = await req.json();
    if (!action) throw new Error("Action is required");
    logStep("Action received", { action });

    // Get user's Paystack subscription details from profile
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("paystack_subscription_code, paystack_email_token, paystack_customer_code")
      .eq("id", user.id)
      .single();

    if (profileError) throw new Error("Failed to fetch profile");

    if (action === "cancel" || action === "disable") {
      const code = profile?.paystack_subscription_code;
      const emailToken = profile?.paystack_email_token;

      if (!code || !emailToken) {
        // Try to fetch subscription from Paystack using customer code
        if (profile?.paystack_customer_code) {
          logStep("Fetching subscriptions from Paystack API");
          const listRes = await fetch(
            `https://api.paystack.co/subscription?customer=${profile.paystack_customer_code}`,
            {
              headers: {
                Authorization: `Bearer ${paystackKey}`,
              },
            }
          );
          const listData = await listRes.json();
          logStep("Paystack subscriptions list", { count: listData.data?.length });

          if (listData.data && listData.data.length > 0) {
            // Find active subscription
            const activeSub = listData.data.find((s: any) => s.status === "active") || listData.data[0];
            const subCode = activeSub.subscription_code;
            const subToken = activeSub.email_token;

            logStep("Found subscription", { subCode, status: activeSub.status });

            // Store for future use
            await supabaseClient
              .from("profiles")
              .update({
                paystack_subscription_code: subCode,
                paystack_email_token: subToken,
              })
              .eq("id", user.id);

            // Disable the subscription
            const disableRes = await fetch("https://api.paystack.co/subscription/disable", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${paystackKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                code: subCode,
                token: subToken,
              }),
            });

            const disableData = await disableRes.json();
            logStep("Disable response", disableData);

            if (!disableData.status) {
              throw new Error(disableData.message || "Failed to cancel subscription");
            }

            // Update profile
            await supabaseClient
              .from("profiles")
              .update({
                subscription_status: "canceled",
                is_premium: false,
                plan_type: "free",
                current_plan: null,
              })
              .eq("id", user.id);

            return new Response(JSON.stringify({ success: true, message: "Subscription canceled successfully" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            });
          } else {
            throw new Error("No active Paystack subscription found");
          }
        } else {
          throw new Error("No Paystack subscription details found");
        }
      } else {
        // We have the code and token, disable directly
        const disableRes = await fetch("https://api.paystack.co/subscription/disable", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${paystackKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code, token: emailToken }),
        });

        const disableData = await disableRes.json();
        logStep("Disable response", disableData);

        if (!disableData.status) {
          throw new Error(disableData.message || "Failed to cancel subscription");
        }

        await supabaseClient
          .from("profiles")
          .update({
            subscription_status: "canceled",
            is_premium: false,
            plan_type: "free",
            current_plan: null,
          })
          .eq("id", user.id);

        return new Response(JSON.stringify({ success: true, message: "Subscription canceled successfully" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    if (action === "enable") {
      const code = profile?.paystack_subscription_code;
      const emailToken = profile?.paystack_email_token;

      if (!code || !emailToken) throw new Error("No Paystack subscription details found to re-enable");

      const enableRes = await fetch("https://api.paystack.co/subscription/enable", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paystackKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, token: emailToken }),
      });

      const enableData = await enableRes.json();
      logStep("Enable response", enableData);

      if (!enableData.status) {
        throw new Error(enableData.message || "Failed to enable subscription");
      }

      await supabaseClient
        .from("profiles")
        .update({
          subscription_status: "active",
          is_premium: true,
          plan_type: "premium",
        })
        .eq("id", user.id);

      return new Response(JSON.stringify({ success: true, message: "Subscription re-enabled successfully" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "update-card") {
      // Generate update card link
      const code = profile?.paystack_subscription_code;
      if (!code) throw new Error("No subscription code found");

      const res = await fetch(`https://api.paystack.co/subscription/${code}/manage/link`, {
        headers: {
          Authorization: `Bearer ${paystackKey}`,
        },
      });

      const data = await res.json();
      logStep("Update card link response", data);

      if (!data.status) {
        throw new Error(data.message || "Failed to generate update link");
      }

      return new Response(JSON.stringify({ success: true, url: data.data.link }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
