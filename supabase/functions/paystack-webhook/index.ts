import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYSTACK-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    logStep("Webhook received");

    const paystackKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackKey) throw new Error("PAYSTACK_SECRET_KEY is not set");

    const body = await req.text();
    
    // Verify webhook signature
    const signature = req.headers.get("x-paystack-signature");
    const hash = createHmac("sha512", paystackKey).update(body).digest("hex");
    
    if (signature !== hash) {
      logStep("Invalid signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);
    logStep("Event type", { type: event.event });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (event.event === "subscription.create" || event.event === "charge.success") {
      const data = event.data;
      const customerEmail = data.customer?.email;

      if (!customerEmail) {
        logStep("No customer email found");
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      // Find user by email
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      if (usersError) {
        logStep("Error listing users", { error: usersError.message });
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const user = users.find(u => u.email === customerEmail);
      if (!user) {
        logStep("User not found for email", { email: customerEmail });
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      // Determine plan from plan code
      const planCode = data.plan?.plan_code || data.subscription?.plan?.plan_code;
      let currentPlan = null;
      
      if (planCode) {
        const interval = data.plan?.interval || data.subscription?.plan?.interval;
        currentPlan = interval === "annually" ? "yearly" : "monthly";
      }

      const customerCode = data.customer?.customer_code;
      const subscriptionCode = data.subscription?.subscription_code || data.subscription_code;
      const emailToken = data.subscription?.email_token || data.email_token;
      
      // Calculate subscription end based on plan interval
      let subscriptionEnd = null;
      if (data.subscription?.next_payment_date) {
        subscriptionEnd = new Date(data.subscription.next_payment_date).toISOString();
      } else if (data.paid_at) {
        const paidDate = new Date(data.paid_at);
        const interval = data.plan?.interval;
        if (interval === "annually") {
          paidDate.setFullYear(paidDate.getFullYear() + 1);
        } else {
          paidDate.setMonth(paidDate.getMonth() + 1);
        }
        subscriptionEnd = paidDate.toISOString();
      }

      logStep("Updating profile", { userId: user.id, plan: currentPlan, customerCode, subscriptionCode });

      const updateData: Record<string, any> = {
        subscription_status: "active",
        current_plan: currentPlan,
        subscription_expiry: subscriptionEnd,
        paystack_customer_code: customerCode,
        is_premium: true,
        plan_type: "premium",
      };

      if (subscriptionCode) updateData.paystack_subscription_code = subscriptionCode;
      if (emailToken) updateData.paystack_email_token = emailToken;

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (updateError) {
        logStep("Error updating profile", { error: updateError.message });
      } else {
        logStep("Profile updated successfully");
      }
    }

    if (event.event === "subscription.disable" || event.event === "subscription.not_renew") {
      const data = event.data;
      const customerEmail = data.customer?.email;

      if (!customerEmail) {
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const { data: { users } } = await supabase.auth.admin.listUsers();
      const user = users?.find(u => u.email === customerEmail);

      if (user) {
        logStep("Canceling subscription for user", { userId: user.id });

        await supabase
          .from("profiles")
          .update({
            subscription_status: "canceled",
            current_plan: null,
            subscription_expiry: null,
            is_premium: false,
            plan_type: "free",
          })
          .eq("id", user.id);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
