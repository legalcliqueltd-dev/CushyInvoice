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
    const { invoiceId, isReminder = false } = await req.json();
    
    if (!invoiceId) {
      throw new Error("Invoice ID is required");
    }

    console.log("Sending invoice email:", { invoiceId, isReminder });

    // Get invoice with client details
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .select(`
        id,
        invoice_number,
        total,
        currency,
        due_date,
        status,
        user_id,
        client_id,
        clients (
          name,
          email
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error("Invoice not found");
    }

    const client = invoice.clients as any;
    if (!client?.email) {
      throw new Error("Client email not found");
    }

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("company_name, email")
      .eq("id", invoice.user_id)
      .single();

    const companyName = profile?.company_name || "Your Company";
    const fromEmail = profile?.email || "noreply@example.com";

    // Use Lovable AI to generate a professional email
    const emailPrompt = isReminder 
      ? `Generate a professional payment reminder email with the following details:
- Company: ${companyName}
- Client: ${client.name}
- Invoice Number: ${invoice.invoice_number}
- Amount: ${invoice.currency} ${invoice.total}
- Due Date: ${new Date(invoice.due_date).toLocaleDateString()}
- Status: ${invoice.status}

The email should be polite but clear that payment is due. Include a gentle reminder about the due date and consequences of late payment. Format as plain text.`
      : `Generate a professional invoice notification email with the following details:
- Company: ${companyName}
- Client: ${client.name}
- Invoice Number: ${invoice.invoice_number}
- Amount: ${invoice.currency} ${invoice.total}
- Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

The email should be polite, professional, and include a call to action to review and pay the invoice. Format as plain text.`;

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
    const subject = isReminder 
      ? `Payment Reminder: Invoice ${invoice.invoice_number} from ${companyName}`
      : `Invoice ${invoice.invoice_number} from ${companyName}`;
    
    const emailData = {
      to: client.email,
      from: fromEmail,
      subject,
      body: emailBody,
      invoice_id: invoiceId,
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
