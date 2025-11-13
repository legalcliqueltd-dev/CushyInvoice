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
    console.log("Starting recurring invoice generation...");

    // Get all active recurring invoices that need to be generated
    const { data: recurringInvoices, error: fetchError } = await supabaseClient
      .from("recurring_invoices")
      .select(`
        *,
        clients(*),
        invoices!recurring_invoices_template_invoice_id_fkey(
          invoice_number,
          subtotal,
          tax_rate,
          tax_amount,
          total,
          currency,
          notes,
          template_id,
          invoice_items(*)
        )
      `)
      .eq("is_active", true)
      .lte("next_invoice_date", new Date().toISOString().split("T")[0]);

    if (fetchError) throw fetchError;

    console.log(`Found ${recurringInvoices?.length || 0} recurring invoices to process`);

    const results = [];

    for (const recurring of recurringInvoices || []) {
      try {
        const templateInvoice = recurring.invoices;
        if (!templateInvoice) {
          console.log(`No template invoice found for recurring ${recurring.id}`);
          continue;
        }

        // Generate invoice number
        const { data: lastInvoice } = await supabaseClient
          .from("invoices")
          .select("invoice_number")
          .eq("user_id", recurring.user_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        let invoiceNumber = "INV-0001";
        if (lastInvoice) {
          const lastNum = parseInt(lastInvoice.invoice_number.split("-")[1]) || 0;
          invoiceNumber = `INV-${String(lastNum + 1).padStart(4, "0")}`;
        }

        const issueDate = new Date().toISOString().split("T")[0];
        const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

        // Create new invoice
        const { data: newInvoice, error: invoiceError } = await supabaseClient
          .from("invoices")
          .insert({
            user_id: recurring.user_id,
            client_id: recurring.client_id,
            template_id: templateInvoice.template_id,
            invoice_number: invoiceNumber,
            issue_date: issueDate,
            due_date: dueDate,
            subtotal: templateInvoice.subtotal,
            tax_rate: templateInvoice.tax_rate,
            tax_amount: templateInvoice.tax_amount,
            total: templateInvoice.total,
            currency: templateInvoice.currency,
            notes: templateInvoice.notes,
            status: "draft",
          })
          .select()
          .single();

        if (invoiceError) throw invoiceError;

        // Copy invoice items
        const itemsToInsert = templateInvoice.invoice_items.map((item: any) => ({
          invoice_id: newInvoice.id,
          product_id: item.product_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          amount: item.amount,
        }));

        const { error: itemsError } = await supabaseClient
          .from("invoice_items")
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;

        // Calculate next invoice date
        let nextDate = new Date(recurring.next_invoice_date);
        switch (recurring.frequency) {
          case "weekly":
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case "monthly":
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case "quarterly":
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case "yearly":
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }

        // Update recurring invoice
        const { error: updateError } = await supabaseClient
          .from("recurring_invoices")
          .update({
            last_generated_date: issueDate,
            next_invoice_date: nextDate.toISOString().split("T")[0],
          })
          .eq("id", recurring.id);

        if (updateError) throw updateError;

        results.push({
          recurring_id: recurring.id,
          invoice_id: newInvoice.id,
          invoice_number: invoiceNumber,
          success: true,
        });

        console.log(`Generated invoice ${invoiceNumber} for recurring ${recurring.id}`);
      } catch (error: any) {
        console.error(`Error processing recurring ${recurring.id}:`, error);
        results.push({
          recurring_id: recurring.id,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Recurring invoice generation completed",
        processed: results.length,
        results,
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
