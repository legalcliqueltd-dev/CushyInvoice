import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (...args: any[]) => console.log("[REVENUECAT-SYNC]", ...args);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser(token);
    if (userErr || !userData.user) throw new Error("Unauthorized");
    const user = userData.user;
    log("User:", user.id);

    const restKey = Deno.env.get("REVENUECAT_REST_API_KEY");
    if (!restKey) throw new Error("REVENUECAT_REST_API_KEY not configured");

    // Query RevenueCat V2 API for subscriber info
    const projectId = "projf2000820";
    const rcUrl = `https://api.revenuecat.com/v2/projects/${projectId}/customers/${user.id}`;
    const rcRes = await fetch(rcUrl, {
      headers: {
        Authorization: `Bearer ${restKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!rcRes.ok) {
      const errText = await rcRes.text();
      log("RevenueCat API error:", rcRes.status, errText);
      throw new Error(`RevenueCat lookup failed (${rcRes.status})`);
    }

    const customer = await rcRes.json();
    log("Customer fetched");

    // Fetch active entitlements for this customer
    const entUrl = `https://api.revenuecat.com/v2/projects/${projectId}/customers/${user.id}/active_entitlements`;
    const entRes = await fetch(entUrl, {
      headers: {
        Authorization: `Bearer ${restKey}`,
        "Content-Type": "application/json",
      },
    });

    let activeEntitlements: any[] = [];
    if (entRes.ok) {
      const entData = await entRes.json();
      activeEntitlements = entData.items ?? [];
    } else {
      log("Entitlements lookup failed:", entRes.status);
    }

    const premium = activeEntitlements.find(
      (e: any) => e.lookup_key === "premium" || e.entitlement_id === "premium"
    );
    const isPremium = !!premium;
    const expiresMs = premium?.expires_at;
    const expiry = expiresMs ? new Date(expiresMs).toISOString() : null;

    log("isPremium:", isPremium, "expiry:", expiry);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    await supabaseAdmin
      .from("profiles")
      .update({
        is_premium: isPremium,
        plan_type: isPremium ? "premium" : "free",
        subscription_status: isPremium ? "active" : "inactive",
        subscription_expiry: expiry,
        current_plan: isPremium ? "ios_iap" : null,
      })
      .eq("id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        is_premium: isPremium,
        expiry,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log("Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
