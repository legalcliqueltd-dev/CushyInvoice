import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AddRecurringInvoiceDialog } from "@/components/AddRecurringInvoiceDialog";
import { Loader2, Calendar, RefreshCw, Trash2, Pause, Play, Zap, Repeat } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
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
        <div className="space-y-6">
          <LoadingState variant="card" rows={3} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <RefreshCw className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Recurring Invoices</h1>
                <p className="text-sm text-muted-foreground">
                  Automate your regular billing with recurring invoices
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
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
            <Card className="neo-card-subtle">
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Recurring Invoices Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Set up recurring invoices to automatically bill your clients on a schedule
                </p>
                <AddRecurringInvoiceDialog onInvoiceAdded={fetchRecurringInvoices} />
              </div>
            </Card>
          ) : (
            <div className="grid gap-3">
              {invoices.map((invoice) => (
                <Card key={invoice.id} className="neo-card-subtle overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5">
                    {/* Client info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${invoice.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                        <RefreshCw className={`h-5 w-5 ${invoice.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{invoice.clients.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {invoice.frequency.charAt(0).toUpperCase() + invoice.frequency.slice(1)}
                          </span>
                          <Badge variant={invoice.is_active ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                            {invoice.is_active ? "Active" : "Paused"}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Next date + actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Next:</span>
                        <span className="font-medium">
                          {new Date(invoice.next_invoice_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleActive(invoice.id, invoice.is_active)}
                        >
                          {invoice.is_active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(invoice.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
