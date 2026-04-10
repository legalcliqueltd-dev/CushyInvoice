import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // Verify user with anon client
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY") ?? "");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const userId = userData.user.id;
    console.log(`[DELETE-ACCOUNT] Deleting account for user: ${userId}`);

    // Use service role client to delete data and user
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    // Delete user data from all tables (order matters for foreign keys)
    const tables = [
      { table: "payment_reminders", column: "user_id" },
      { table: "email_logs", column: "user_id" },
      { table: "invoice_items", column: "invoice_id", subquery: true },
      { table: "payments", column: "invoice_id", subquery: true },
      { table: "recurring_invoices", column: "user_id" },
      { table: "invoices", column: "user_id" },
      { table: "expenses", column: "user_id" },
      { table: "products", column: "user_id" },
      { table: "invoice_templates", column: "user_id" },
      { table: "clients", column: "user_id" },
      { table: "profiles", column: "id" },
    ];

    for (const t of tables) {
      if (t.subquery) {
        // Delete items linked via invoices
        const { data: invoices } = await adminClient
          .from("invoices")
          .select("id")
          .eq("user_id", userId);
        const invoiceIds = (invoices || []).map((i: any) => i.id);
        if (invoiceIds.length > 0) {
          await adminClient.from(t.table).delete().in(t.column, invoiceIds);
        }
      } else {
        await adminClient.from(t.table).delete().eq(t.column, userId);
      }
      console.log(`[DELETE-ACCOUNT] Deleted from ${t.table}`);
    }

    // Delete storage files
    try {
      const { data: files } = await adminClient.storage
        .from("company-logos")
        .list(userId);
      if (files && files.length > 0) {
        const paths = files.map((f: any) => `${userId}/${f.name}`);
        await adminClient.storage.from("company-logos").remove(paths);
      }
    } catch (e) {
      console.log("[DELETE-ACCOUNT] Storage cleanup error (non-fatal):", e);
    }

    // Delete auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    console.log(`[DELETE-ACCOUNT] Successfully deleted user ${userId}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[DELETE-ACCOUNT] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
