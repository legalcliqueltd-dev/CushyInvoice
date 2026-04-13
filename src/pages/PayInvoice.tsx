import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, FileText, AlertCircle, CheckCircle, CreditCard } from "lucide-react";
import { getCurrencySymbol } from "@/lib/currencies";

interface InvoicePayData {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  total: number;
  currency: string;
  subtotal: number;
  tax_amount: number | null;
  tax_rate: number | null;
  clients: { name: string; email: string } | null;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

const PayInvoice = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [searchParams] = useSearchParams();
  const canceled = searchParams.get("canceled") === "true";

  const [invoice, setInvoice] = useState<InvoicePayData | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) {
        setError("Invalid invoice link");
        setLoading(false);
        return;
      }

      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .select("id, invoice_number, issue_date, due_date, status, total, currency, subtotal, tax_amount, tax_rate, clients(name, email)")
        .eq("id", invoiceId)
        .single();

      if (invErr || !inv) {
        setError("Invoice not found");
        setLoading(false);
        return;
      }

      setInvoice(inv as unknown as InvoicePayData);

      const { data: itms } = await supabase
        .from("invoice_items")
        .select("description, quantity, unit_price, amount")
        .eq("invoice_id", invoiceId);

      setItems((itms as InvoiceItem[]) || []);
      setLoading(false);
    };

    fetchInvoice();
  }, [invoiceId]);

  const handlePay = async () => {
    if (!invoiceId) return;
    setPaying(true);

    try {
      const { data, error: fnErr } = await supabase.functions.invoke("pay-invoice", {
        body: { invoiceId },
      });

      if (fnErr) throw fnErr;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initiate payment");
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full neo-card-subtle">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Error</h2>
            <p className="text-muted-foreground">{error || "Invoice not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPaid = invoice.status === "paid";
  const symbol = getCurrencySymbol(invoice.currency);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full neo-card-subtle">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Invoice {invoice.invoice_number}</CardTitle>
          {invoice.clients && (
            <p className="text-sm text-muted-foreground">
              Billed to: {invoice.clients.name}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {canceled && (
            <div className="rounded-lg bg-destructive/10 p-3 text-center text-sm text-destructive">
              Payment was canceled. You can try again below.
            </div>
          )}

          {/* Line items */}
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-foreground">
                  {item.description}
                  {item.quantity > 1 && <span className="text-muted-foreground"> × {item.quantity}</span>}
                </span>
                <span className="font-medium text-foreground">
                  {symbol}{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{symbol}{invoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            {invoice.tax_amount && invoice.tax_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({invoice.tax_rate || 0}%)</span>
                <span>{symbol}{invoice.tax_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2">
              <span className="text-foreground">Total</span>
              <span className="text-foreground">
                {symbol}{invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <Separator />

          {/* Pay / Paid state */}
          {isPaid ? (
            <div className="rounded-lg bg-success/10 p-4 text-center space-y-2">
              <CheckCircle className="h-8 w-8 text-success mx-auto" />
              <p className="font-semibold text-success">This invoice has been paid</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                className="w-full neo-btn-subtle bg-foreground text-background hover:bg-foreground/90 font-semibold"
                size="lg"
                onClick={handlePay}
                disabled={paying}
              >
                {paying ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-5 w-5 mr-2" />
                )}
                {paying ? "Redirecting..." : `Pay ${symbol}${invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Secure payment powered by Stripe • Apple Pay & Google Pay supported
              </p>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Due: {new Date(invoice.due_date).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayInvoice;
