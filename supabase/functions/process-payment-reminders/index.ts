import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-PAYMENT-REMINDERS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting payment reminders processing");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all pending reminders
    const { data: reminders, error: remindersError } = await supabase
      .from("payment_reminders")
      .select(`
        id,
        reminder_type,
        days_before_due,
        invoice_id,
        invoices (
          id,
          invoice_number,
          due_date,
          total,
          currency,
          client_id,
          clients (
            name,
            email
          )
        )
      `)
      .eq("status", "pending");

    if (remindersError) throw remindersError;
    logStep("Found reminders", { count: reminders?.length || 0 });

    let processedCount = 0;

    for (const reminder of reminders || []) {
      const invoice = reminder.invoices as any;
      if (!invoice || !invoice.clients) continue;

      const dueDate = new Date(invoice.due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      let shouldSend = false;
      
      if (reminder.reminder_type === "before_due") {
        const reminderDate = new Date(dueDate);
        reminderDate.setDate(reminderDate.getDate() - reminder.days_before_due);
        shouldSend = reminderDate.getTime() === today.getTime();
      } else if (reminder.reminder_type === "on_due") {
        shouldSend = dueDate.getTime() === today.getTime();
      } else if (reminder.reminder_type === "overdue") {
        const reminderDate = new Date(dueDate);
        reminderDate.setDate(reminderDate.getDate() + reminder.days_before_due);
        shouldSend = reminderDate.getTime() === today.getTime();
      }

      if (shouldSend) {
        logStep("Sending reminder", { reminderId: reminder.id, invoiceNumber: invoice.invoice_number });

        // Call send-invoice-email function using Supabase client
        const { data: emailData, error: emailError } = await supabase.functions.invoke(
          'send-invoice-email',
          {
            body: {
              invoiceId: invoice.id,
              isReminder: true,
            },
          }
        );

        if (!emailError) {
          await supabase
            .from("payment_reminders")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", reminder.id);
          
          processedCount++;
          logStep("Reminder sent successfully", { reminderId: reminder.id });
        } else {
          logStep("Failed to send reminder", { reminderId: reminder.id, error: emailError.message });
        }
      }
    }

    logStep("Processing complete", { processedCount });

    return new Response(
      JSON.stringify({ success: true, processed: processedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
