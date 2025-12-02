import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Mail,
  Edit,
  Trash2,
  DollarSign,
  ArrowLeft,
  Share2,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { currencies, getCurrencySymbol } from "@/lib/currencies";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddPaymentReminderDialog } from "@/components/AddPaymentReminderDialog";

interface InvoiceData {
  id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  notes?: string;
  clients: {
    name: string;
    email: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    phone?: string;
  };
  invoice_items: {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }[];
  payments: {
    id: string;
    amount: number;
    payment_date: string;
    payment_method?: string;
  }[];
}

interface ProfileData {
  company_name?: string;
  company_logo?: string;
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPayment, setGeneratingPayment] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInvoice();
    }
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("invoices")
        .select(
          `
          *,
          clients(*),
          invoice_items(*),
          payments(*)
        `
        )
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setInvoice(data);
      setDisplayCurrency(data?.currency || "USD");

      // Fetch profile for company logo
      const { data: profileData } = await supabase
        .from("profiles")
        .select("company_name, company_logo")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error fetching invoice:", error);
      }
      toast({
        title: "Error",
        description: "Failed to load invoice",
        variant: "destructive",
      });
      navigate("/invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;

    try {
      const { error } = await supabase.from("invoices").delete().eq("id", id);

      if (error) throw error;

      toast({ title: "Invoice deleted successfully" });
      navigate("/invoices");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePayNow = async () => {
    setPaymentLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { invoiceId: id },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create payment session. Please try again.",
        variant: "destructive",
      });
      setPaymentLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoice) return;

    try {
      const { data, error } = await supabase.functions.invoke("send-invoice-email", {
        body: {
          invoice_id: invoice.id,
          client_email: invoice.clients.email,
          client_name: invoice.clients.name,
          invoice_number: invoice.invoice_number,
          total: invoice.total,
          currency: invoice.currency,
        },
      });

      if (error) throw error;

      toast({
        title: "Email Sent",
        description: "Invoice notification has been sent to the client.",
      });
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description: "Failed to send email notification.",
        variant: "destructive",
      });
    }
  };

  const handleGeneratePaymentLink = async () => {
    setGeneratingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-invoice-payment", {
        body: { invoiceId: id },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        toast({
          title: "Payment Link Generated",
          description: "Opening Stripe checkout in a new tab...",
        });
      }
    } catch (error: any) {
      console.error("Error generating payment link:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate payment link",
        variant: "destructive",
      });
    } finally {
      setGeneratingPayment(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-success text-white";
      case "sent":
        return "bg-info text-white";
      case "overdue":
        return "bg-destructive text-white";
      case "draft":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const totalPaid = invoice?.payments.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  ) || 0;
  const amountDue = invoice ? Number(invoice.total) - totalPaid : 0;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Invoice not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Company Logo */}
        {profile?.company_logo && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <img
                  src={profile.company_logo}
                  alt={profile.company_name || "Company Logo"}
                  className="h-16 w-auto object-contain"
                />
                {profile.company_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">From</p>
                    <p className="font-semibold text-lg">{profile.company_name}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/invoices")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {invoice.invoice_number}
                </h1>
                <Badge className={getStatusColor(invoice.status)}>
                  {invoice.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Issued: {format(new Date(invoice.issue_date), "PPP")}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {invoice.status !== "paid" && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleGeneratePaymentLink}
                disabled={generatingPayment}
              >
                {generatingPayment ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Generate Payment Link
              </Button>
            )}
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleSendEmail}>
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                const text = `Invoice ${invoice.invoice_number} from ${profile?.company_name || 'Company'}\n\nAmount Due: ${getCurrencySymbol(invoice.currency)}${invoice.total.toFixed(2)}\nDue Date: ${format(new Date(invoice.due_date), 'PPP')}\n\nView details: ${window.location.href}`;
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                window.open(whatsappUrl, '_blank');
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share via WhatsApp
            </Button>
            <AddPaymentReminderDialog invoiceId={id!} onReminderAdded={fetchInvoice} />
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Currency Selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Display Currency:</span>
              <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Global</div>
                  {currencies.filter(c => c.region === 'global').map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.code} - {curr.symbol}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground mt-2">African</div>
                  {currencies.filter(c => c.region === 'africa').map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.code} - {curr.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Bill To</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-semibold">{invoice.clients.name}</p>
              <p className="text-sm text-muted-foreground">{invoice.clients.email}</p>
              {invoice.clients.phone && (
                <p className="text-sm text-muted-foreground">{invoice.clients.phone}</p>
              )}
              {invoice.clients.address && (
                <div className="text-sm text-muted-foreground">
                  <p>{invoice.clients.address}</p>
                  {invoice.clients.city && (
                    <p>
                      {invoice.clients.city}
                      {invoice.clients.state && `, ${invoice.clients.state}`}{" "}
                      {invoice.clients.zip_code}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Number:</span>
                <span className="font-medium">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issue Date:</span>
                <span className="font-medium">
                  {format(new Date(invoice.issue_date), "PPP")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date:</span>
                <span className="font-medium">
                  {format(new Date(invoice.due_date), "PPP")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge className={getStatusColor(invoice.status)}>
                  {invoice.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.invoice_items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-right">{Number(item.quantity)}</TableCell>
                    <TableCell className="text-right">
                      {getCurrencySymbol(displayCurrency)}{Number(item.unit_price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getCurrencySymbol(displayCurrency)}{Number(item.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">{getCurrencySymbol(displayCurrency)}{Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({Number(invoice.tax_rate)}%):</span>
                <span className="font-medium">{getCurrencySymbol(displayCurrency)}{Number(invoice.tax_amount).toFixed(2)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{getCurrencySymbol(displayCurrency)}{Number(invoice.total).toFixed(2)}</span>
              </div>
              {totalPaid > 0 && (
                <>
                  <div className="flex justify-between text-success">
                    <span>Total Paid:</span>
                    <span>-{getCurrencySymbol(displayCurrency)}{totalPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Amount Due:</span>
                    <span>{getCurrencySymbol(displayCurrency)}{amountDue.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {invoice.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {invoice.notes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Payments */}
        {invoice.payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {format(new Date(payment.payment_date), "PPP")}
                      </TableCell>
                      <TableCell>{payment.payment_method || "N/A"}</TableCell>
                      <TableCell className="text-right">
                        {getCurrencySymbol(displayCurrency)}{Number(payment.amount).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Pay Now / Record Payment */}
        {invoice.status !== "paid" && amountDue > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Amount Due: {getCurrencySymbol(displayCurrency)}{amountDue.toFixed(2)}
                </p>
                <div className="flex gap-3">
                  <Button onClick={handlePayNow} disabled={paymentLoading}>
                    {paymentLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Pay Now
                      </>
                    )}
                  </Button>
                  <Button variant="outline">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Record Payment Manually
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
