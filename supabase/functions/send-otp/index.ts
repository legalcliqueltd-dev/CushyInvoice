import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!resendApiKey) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: userData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userId = userData.user.id;
  const email = userData.user.email ?? "";

  try {
    // Rate-limit: deny if an OTP was sent within the last 60 seconds
    const { data: existing } = await supabase
      .from("otp_verifications")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const secondsAgo = (Date.now() - new Date(existing.created_at).getTime()) / 1000;
      if (secondsAgo < 60) {
        return new Response(
          JSON.stringify({ error: "Please wait before requesting a new code." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Delete any previous OTPs for this user
    await supabase.from("otp_verifications").delete().eq("user_id", userId);

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    await supabase.from("otp_verifications").insert({ user_id: userId, email, code, expires_at: expiresAt });

    // Send email via Resend
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 24px;text-align:center;">
      <h1 style="color:#ffffff;font-size:22px;margin:0;">Verify your email</h1>
    </div>
    <div style="padding:32px 24px;text-align:center;">
      <p style="font-size:15px;color:#475569;margin:0 0 24px;">Enter this code in the app to complete your sign-up.</p>
      <div style="display:inline-block;background:#f1f5f9;border-radius:12px;padding:20px 36px;margin:0 0 24px;">
        <span style="font-size:40px;font-weight:700;letter-spacing:10px;color:#1e293b;">${code}</span>
      </div>
      <p style="font-size:13px;color:#94a3b8;margin:0;">This code expires in <strong>5 minutes</strong>. If you didn't sign up for CushyInvoice, you can safely ignore this email.</p>
    </div>
    <div style="padding:16px 24px;background:#f8fafc;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="font-size:12px;color:#94a3b8;margin:0;">© ${new Date().getFullYear()} CushyInvoice. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CushyInvoice <noreply@cushyinvoice.com>",
        to: [email],
        subject: "Your CushyInvoice verification code",
        html,
      }),
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      throw new Error(resendData.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-otp error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
