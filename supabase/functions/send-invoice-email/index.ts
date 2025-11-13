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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { invoice_id, client_email, client_name, invoice_number, total, currency } = await req.json();

    console.log("Sending invoice email:", { invoice_id, client_email, invoice_number });

    // Get user/company info
    const { data: invoice } = await supabaseClient
      .from("invoices")
      .select("user_id")
      .eq("id", invoice_id)
      .single();

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("company_name, email")
      .eq("id", invoice.user_id)
      .single();

    const companyName = profile?.company_name || "Your Company";
    const fromEmail = profile?.email || "noreply@example.com";

    // Use Lovable AI to generate a professional email
    const emailPrompt = `Generate a professional invoice notification email with the following details:
- Company: ${companyName}
- Client: ${client_name}
- Invoice Number: ${invoice_number}
- Amount: ${currency} ${total}

The email should be polite, professional, and include:
1. A greeting
2. Notification that the invoice is ready
3. The invoice details
4. A call to action to review/pay
5. A professional closing

Format it as plain text for an email body.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: emailPrompt,
          },
        ],
        max_tokens: 500,
      }),
    });

    const aiData = await aiResponse.json();
    const emailBody = aiData.choices?.[0]?.message?.content || "Invoice notification";

    console.log("Email generated successfully");

    // In a real implementation, you would send the email here using a service like Resend or SendGrid
    // For now, we'll just log it and store a record
    const emailData = {
      to: client_email,
      from: fromEmail,
      subject: `Invoice ${invoice_number} from ${companyName}`,
      body: emailBody,
      invoice_id,
      sent: true,
      sent_at: new Date().toISOString(),
    };

    console.log("Email would be sent:", emailData);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email notification prepared",
        email_preview: emailBody,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
