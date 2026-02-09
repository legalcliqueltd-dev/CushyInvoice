import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AddRecurringInvoiceDialog } from "@/components/AddRecurringInvoiceDialog";
import { Loader2, Calendar, RefreshCw, Trash2, Pause, Play, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RecurringInvoice {
  id: string;
  client_id: string;
  frequency: string;
  start_date: string;
  next_invoice_date: string;
  is_active: boolean;
  clients: {
    name: string;
  };
}

export default function RecurringInvoices() {
  const [invoices, setInvoices] = useState<RecurringInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecurringInvoices();
  }, []);

  const fetchRecurringInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("recurring_invoices")
        .select(`*, clients(name)`)
        .order("next_invoice_date", { ascending: true });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load recurring invoices",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("recurring_invoices")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: currentStatus ? "Recurring Invoice Paused" : "Recurring Invoice Activated",
        description: `The recurring invoice has been ${currentStatus ? "paused" : "activated"}.`,
      });

      fetchRecurringInvoices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("recurring_invoices")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast({
        title: "Recurring Invoice Deleted",
        description: "The recurring invoice has been deleted successfully.",
      });

      fetchRecurringInvoices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleGenerateInvoices = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-recurring-invoices");

      if (error) throw error;

      toast({
        title: "Invoices Generated",
        description: `Successfully processed ${data.processed} recurring invoice(s).`,
      });

      fetchRecurringInvoices();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate invoices",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Recurring Invoices</h1>
              <p className="text-muted-foreground">
                Automate your regular billing with recurring invoices
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGenerateInvoices}
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                Generate Now
              </Button>
              <AddRecurringInvoiceDialog onInvoiceAdded={fetchRecurringInvoices} />
            </div>
          </div>

          {invoices.length === 0 ? (
            <Card className="p-12 text-center neo-card-subtle">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Recurring Invoices Yet</h3>
              <p className="text-muted-foreground mb-6">
                Set up recurring invoices to automatically bill your clients
              </p>
              <AddRecurringInvoiceDialog onInvoiceAdded={fetchRecurringInvoices} />
            </Card>
          ) : (
            <div className="grid gap-4">
              {invoices.map((invoice) => (
                <Card key={invoice.id} className="p-6 neo-card-subtle">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <RefreshCw className="h-8 w-8 text-primary" />
                      <div>
                        <h3 className="font-semibold text-lg">{invoice.clients.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {invoice.frequency.charAt(0).toUpperCase() + invoice.frequency.slice(1)} billing
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Next Invoice</p>
                        <p className="font-semibold">
                          {new Date(invoice.next_invoice_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={invoice.is_active ? "default" : "secondary"}>
                        {invoice.is_active ? "Active" : "Paused"}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleActive(invoice.id, invoice.is_active)}
                        >
                          {invoice.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(invoice.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Recurring Invoice</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this recurring invoice? This will not affect previously generated invoices.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
    </DashboardLayout>
  );
}
