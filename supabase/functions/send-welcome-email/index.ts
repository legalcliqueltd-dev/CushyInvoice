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

  // Authenticate
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
  if (authError || !userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { userId } = await req.json();
    const targetUserId = userId || userData.user.id;

    // Verify the caller is requesting for themselves
    if (targetUserId !== userData.user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name, email")
      .eq("id", targetUserId)
      .single();

    const userName = profile?.full_name || "there";
    const userEmail = profile?.email || userData.user.email;

    if (!userEmail) {
      throw new Error("No email found for user");
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 24px;text-align:center;">
      <h1 style="color:#ffffff;font-size:24px;margin:0 0 8px;">Welcome to CushyInvoice! 🎉</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;">Your invoicing just got a whole lot easier</p>
    </div>
    
    <div style="padding:32px 24px;">
      <p style="font-size:16px;color:#1e293b;margin:0 0 16px;">Hi ${userName},</p>
      <p style="font-size:14px;color:#475569;line-height:1.6;margin:0 0 24px;">
        Thanks for signing up! You're on a <strong>7-day free trial</strong> with full access to all premium features. Here's how to get started:
      </p>
      
      <div style="background:#f8fafc;border-radius:8px;padding:20px;margin:0 0 24px;">
        <p style="font-size:13px;font-weight:600;color:#1e293b;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.5px;">Quick Start Guide</p>
        
        <div style="display:flex;align-items:flex-start;margin:0 0 12px;">
          <div style="width:24px;height:24px;border-radius:50%;background:#6366f1;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:12px;">1</div>
          <div>
            <p style="font-size:14px;color:#1e293b;font-weight:500;margin:0;">Complete your company profile</p>
            <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Add your logo, address, and bank details in Settings</p>
          </div>
        </div>
        
        <div style="display:flex;align-items:flex-start;margin:0 0 12px;">
          <div style="width:24px;height:24px;border-radius:50%;background:#6366f1;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:12px;">2</div>
          <div>
            <p style="font-size:14px;color:#1e293b;font-weight:500;margin:0;">Add your first client</p>
            <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Go to Clients and add their name and email</p>
          </div>
        </div>
        
        <div style="display:flex;align-items:flex-start;margin:0 0 12px;">
          <div style="width:24px;height:24px;border-radius:50%;background:#6366f1;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:12px;">3</div>
          <div>
            <p style="font-size:14px;color:#1e293b;font-weight:500;margin:0;">Create your first invoice</p>
            <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Add items, set your due date, and you're done</p>
          </div>
        </div>
        
        <div style="display:flex;align-items:flex-start;">
          <div style="width:24px;height:24px;border-radius:50%;background:#6366f1;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-right:12px;">4</div>
          <div>
            <p style="font-size:14px;color:#1e293b;font-weight:500;margin:0;">Send it to your client</p>
            <p style="font-size:12px;color:#64748b;margin:4px 0 0;">Share via email or download the PDF</p>
          </div>
        </div>
      </div>
      
      <div style="text-align:center;margin:0 0 24px;">
        <a href="https://cushyinvoice.com/dashboard" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:14px;font-weight:600;">Go to Dashboard →</a>
      </div>
      
      <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0;">
        Need help? Just reply to this email and we'll get back to you.
      </p>
    </div>
    
    <div style="padding:16px 24px;background:#f8fafc;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="font-size:12px;color:#94a3b8;margin:0;">© ${new Date().getFullYear()} CushyInvoice. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

    // Send via Resend directly
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CushyInvoice <noreply@cushyinvoice.com>",
        to: [userEmail],
        subject: "Welcome to CushyInvoice! 🎉 Here's how to get started",
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);
      throw new Error(resendData.message || "Failed to send welcome email");
    }

    console.log("Welcome email sent to:", userEmail, "Resend ID:", resendData.id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
