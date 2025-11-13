import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { AddRecurringInvoiceDialog } from "@/components/AddRecurringInvoiceDialog";
import { Loader2, Lock, Calendar, RefreshCw, Trash2, Pause, Play } from "lucide-react";
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
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { limits } = usePlanLimits();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (limits.isPremium) {
      fetchRecurringInvoices();
    } else {
      setLoading(false);
    }
  }, [limits.isPremium]);

  const fetchRecurringInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from("recurring_invoices")
        .select(`
          *,
          clients(name)
        `)
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

  if (!limits.isPremium) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-primary/10">
                <Lock className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">Premium Feature</h1>
            <p className="text-muted-foreground mb-8 text-lg">
              Recurring invoices are available on the Premium plan. Automate your invoicing and save time.
            </p>
            <Button size="lg" onClick={() => navigate("/subscribe")}>
              Upgrade to Premium
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Recurring Invoices</h1>
            <p className="text-muted-foreground mt-2">
              Automate your regular billing with recurring invoices
            </p>
          </div>
          <AddRecurringInvoiceDialog onInvoiceAdded={fetchRecurringInvoices} />
        </div>

        {invoices.length === 0 ? (
          <Card className="p-12 text-center">
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
              <Card key={invoice.id} className="p-6">
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
    </div>
  );
}
