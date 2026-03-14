import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

const safeTimestampToISO = (timestamp: any): string | null => {
  if (!timestamp) return null;
  if (typeof timestamp === 'string') return timestamp;
  const ms = typeof timestamp === 'number' ? timestamp * 1000 : NaN;
  const date = new Date(ms);
  return isNaN(date.getTime()) ? null : date.toISOString();
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    // Check if user is a whitelisted tester
    const { data: testerEntry } = await supabaseClient
      .from('tester_emails')
      .select('email')
      .eq('email', user.email)
      .maybeSingle();

    if (testerEntry) {
      logStep("Tester email found, granting free premium access", { email: user.email });
      return new Response(JSON.stringify({
        subscribed: true,
        status: 'active',
        current_plan: 'tester',
        subscription_end: null,
        trial_end: null,
        plan_type: 'tester',
        is_premium: true,
        provider: 'tester'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found, checking Paystack");
      
      // Check profile for Paystack subscription or trial
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('plan_type, trial_end_date, paystack_customer_code, is_premium, subscription_status, current_plan, subscription_expiry')
        .eq('id', user.id)
        .single();
      
      // If user has a Paystack subscription that's active, return that
      if (profile?.paystack_customer_code && profile?.is_premium) {
        logStep("Active Paystack subscription found");
        return new Response(JSON.stringify({
          subscribed: true,
          status: profile.subscription_status || 'active',
          current_plan: profile.current_plan,
          subscription_end: profile.subscription_expiry,
          trial_end: profile.trial_end_date,
          plan_type: 'premium',
          is_premium: true,
          provider: 'paystack'
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      let planType = profile?.plan_type || 'trial';
      let isPremium = false;
      
      // Check if trial has expired
      if (planType === 'trial' && profile?.trial_end_date) {
        const trialEnd = new Date(profile.trial_end_date);
        if (trialEnd < new Date()) {
          planType = 'free';
          await supabaseClient
            .from('profiles')
            .update({ 
              plan_type: 'free',
              is_premium: false,
              subscription_status: 'inactive' 
            })
            .eq('id', user.id);
        } else {
          isPremium = true;
        }
      }

      return new Response(JSON.stringify({ 
        subscribed: isPremium,
        status: 'inactive',
        plan_type: planType,
        is_premium: isPremium,
        trial_end: profile?.trial_end_date
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });
    
    const hasActiveSub = subscriptions.data.length > 0 && 
      (subscriptions.data[0].status === "active" || subscriptions.data[0].status === "trialing");
    let currentPlan = null;
    let subscriptionEnd = null;
    let trialEnd = null;
    let status = 'inactive';

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      status = subscription.status;
      subscriptionEnd = safeTimestampToISO(subscription.current_period_end);
      trialEnd = safeTimestampToISO(subscription.trial_end);
      
      const priceId = subscription.items.data[0].price.id;
      
      // Map price IDs to plan names
      if (priceId === 'price_1SRxiBDjurOQIWXOB9mPYt6n') {
        currentPlan = 'monthly';
      } else if (priceId === 'price_1SRxiTDjurOQIWXOiRxfdxhj') {
        currentPlan = 'yearly';
      }
      
      logStep("Subscription found", { 
        subscriptionId: subscription.id, 
        plan: currentPlan,
        status: status,
        trialEnd
      });

      // Update profile in Supabase
      await supabaseClient
        .from('profiles')
        .update({
          subscription_status: status,
          current_plan: currentPlan,
          subscription_expiry: subscriptionEnd,
          trial_end_date: trialEnd,
          stripe_customer_id: customerId,
          plan_type: status === 'active' || status === 'trialing' ? 'premium' : 'free',
          is_premium: status === 'active' || status === 'trialing'
        })
        .eq('id', user.id);
    } else {
      logStep("No subscription found");
      
      // Update profile to inactive/free
      await supabaseClient
        .from('profiles')
        .update({ 
          subscription_status: 'inactive',
          plan_type: 'free',
          is_premium: false
        })
        .eq('id', user.id);
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      status: status,
      current_plan: currentPlan,
      subscription_end: subscriptionEnd,
      trial_end: trialEnd,
      plan_type: hasActiveSub ? 'premium' : 'free',
      is_premium: hasActiveSub,
      provider: 'stripe'
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
