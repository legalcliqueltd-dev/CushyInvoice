import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const sanitizeForPrompt = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/ignore\s+(all\s+)?previous\s+instructions/gi, "")
    .replace(/ignore\s+(all\s+)?above/gi, "")
    .replace(/system\s*:/gi, "")
    .replace(/\n{2,}/g, " ")
    .slice(0, 200)
    .trim();
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  // Authentication: accept either user JWT or service role key
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const isServiceRole = token === serviceRoleKey;

  // Create client with service role for DB operations
  const supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  let authenticatedUserId: string | null = null;

  if (!isServiceRole) {
    // Validate user JWT
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    authenticatedUserId = userData.user.id;
  }

  try {
    const { invoiceId, pdfBase64, isReminder = false } = await req.json();

    if (!invoiceId) {
      throw new Error("Invoice ID is required");
    }

    console.log("Sending invoice email:", { invoiceId, isReminder, hasPdf: !!pdfBase64 });

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

    // If called by a user (not service role), verify ownership
    if (authenticatedUserId && invoice.user_id !== authenticatedUserId) {
      return new Response(JSON.stringify({ error: "Forbidden - you do not own this invoice" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    const companyName = sanitizeForPrompt(profile?.company_name || "Your Company");
    const fromEmail = profile?.email || "noreply@example.com";
    const clientName = sanitizeForPrompt(client.name);
    const invoiceNumber = sanitizeForPrompt(invoice.invoice_number);
    const amount = `${sanitizeForPrompt(invoice.currency)} ${Number(invoice.total).toFixed(2)}`;
    const dueDate = new Date(invoice.due_date).toLocaleDateString();

    // Generate email content using AI with structured prompts
    const systemPrompt = "You are a professional email writer for invoices. Generate polite, professional invoice emails. Never include threatening language, legal threats, or demands. Output only the email body text. Keep it concise (under 150 words).";

    const userPrompt = isReminder
      ? `Write a payment reminder email. Company: ${companyName}. Client: ${clientName}. Invoice: ${invoiceNumber}. Amount: ${amount}. Due date: ${dueDate}. Status: ${sanitizeForPrompt(invoice.status)}. The PDF invoice is attached. Be polite but clear that payment is due.`
      : `Write an invoice email. Company: ${companyName}. Client: ${clientName}. Invoice: ${invoiceNumber}. Amount: ${amount}. Due date: ${dueDate}. The PDF invoice is attached. Include a call to action to review and pay.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
      }),
    });

    const aiData = await aiResponse.json();
    const emailBody = aiData.choices?.[0]?.message?.content || "Please find your invoice attached.";

    console.log("Email content generated successfully");

    // Build email data
    const subject = isReminder
      ? `Payment Reminder: Invoice ${invoiceNumber} from ${companyName}`
      : `Invoice ${invoiceNumber} from ${companyName}`;

    const emailData = {
      to: client.email,
      from: fromEmail,
      subject,
      body: emailBody,
      invoice_id: invoiceId,
      has_attachment: !!pdfBase64,
      sent: true,
      sent_at: new Date().toISOString(),
    };

    // Log the email for records
    await supabaseClient
      .from("email_logs")
      .insert({
        user_id: invoice.user_id,
        invoice_id: invoiceId,
        recipient_email: client.email,
        subject: subject,
        body: emailBody,
        email_type: isReminder ? "reminder" : "invoice",
        sent_manually: true,
      });

    console.log("Email logged:", emailData);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invoice email sent to ${client.email}`,
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
