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
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

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

  const supabaseClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  let authenticatedUserId: string | null = null;

  if (!isServiceRole) {
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
    const { invoiceId, pdfBase64, isReminder = false, recipientEmail } = await req.json();

    if (!invoiceId) {
      throw new Error("Invoice ID is required");
    }

    console.log("Sending invoice email:", { invoiceId, isReminder, hasPdf: !!pdfBase64, recipientEmail });

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

    if (authenticatedUserId && invoice.user_id !== authenticatedUserId) {
      return new Response(JSON.stringify({ error: "Forbidden - you do not own this invoice" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = invoice.clients as any;
    if (!recipientEmail && !client?.email) {
      throw new Error("No recipient email provided and client email not found");
    }

    const toEmail = recipientEmail || client?.email;

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

    // Static professional email body
    const emailBody = isReminder
      ? `<p>Dear ${clientName},</p>
<p>This is a friendly reminder that Invoice <strong>${invoiceNumber}</strong> for <strong>${amount}</strong> was due on <strong>${dueDate}</strong>.</p>
<p>Please find the invoice attached for your reference. Kindly arrange payment at your earliest convenience.</p>
<p>If you have already made the payment, please disregard this message.</p>
<p>Thank you,<br/>${companyName}</p>`
      : `<p>Dear ${clientName},</p>
<p>Please find attached Invoice <strong>${invoiceNumber}</strong> for <strong>${amount}</strong>, due on <strong>${dueDate}</strong>.</p>
<p>Kindly review and arrange payment at your convenience.</p>
<p>Thank you,<br/>${companyName}</p>`;

    console.log("Email content generated successfully");

    const subject = isReminder
      ? `Payment Reminder: Invoice ${invoiceNumber} from ${companyName}`
      : `Invoice ${invoiceNumber} from ${companyName}`;

    // Wrap in a nice HTML template
    const fullHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px;text-align:center;">
      <h1 style="color:#ffffff;font-size:20px;margin:0;">${subject}</h1>
    </div>
    <div style="padding:24px;font-size:14px;color:#475569;line-height:1.6;">
      ${emailBody}
    </div>
    <div style="padding:16px 24px;background:#f8fafc;text-align:center;border-top:1px solid #e2e8f0;">
      <p style="font-size:12px;color:#94a3b8;margin:0;">Sent via CushyInvoice</p>
    </div>
  </div>
</body>
</html>`;

    // Send via Resend if API key is configured
    let emailSent = false;
    if (resendApiKey) {
      try {
        const resendPayload: Record<string, unknown> = {
          from: `${companyName} via CushyInvoice <noreply@cushyinvoice.com>`,
          to: [toEmail],
          subject,
          html: fullHtml,
        };

        if (pdfBase64) {
          resendPayload.attachments = [{
            filename: `${invoiceNumber}.pdf`,
            content: pdfBase64,
          }];
        }

        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(resendPayload),
        });

        const resendData = await resendResponse.json();
        if (resendResponse.ok) {
          emailSent = true;
          console.log("Email sent via Resend:", resendData.id);
        } else {
          console.error("Resend API error:", resendData);
        }
      } catch (resendError) {
        console.error("Resend send failed:", resendError);
      }
    } else {
      console.log("RESEND_API_KEY not configured, email logged only");
    }

    // Log the email
    await supabaseClient
      .from("email_logs")
      .insert({
        user_id: invoice.user_id,
        invoice_id: invoiceId,
        recipient_email: toEmail,
        subject: subject,
        body: emailBody,
        email_type: isReminder ? "reminder" : "invoice",
        sent_manually: true,
      });

    return new Response(
      JSON.stringify({
        success: true,
        email_sent: emailSent,
        message: emailSent
          ? `Invoice email sent to ${toEmail}`
          : `Invoice email logged (email delivery not configured)`,
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
