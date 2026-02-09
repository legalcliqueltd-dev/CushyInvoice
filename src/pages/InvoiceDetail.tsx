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
  Trash2,
  ArrowLeft,
  Building2,
  FileText,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { currencies, getCurrencySymbol } from "@/lib/currencies";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShareInvoiceDialog } from "@/components/ShareInvoiceDialog";
import { generateInvoicePdf, downloadPdf } from "@/lib/generateInvoicePdf";

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
  address?: string;
  email?: string;
  phone?: string;
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayCurrency, setDisplayCurrency] = useState("USD");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

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

      // Fetch profile for company info
      const { data: profileData } = await supabase
        .from("profiles")
        .select("company_name, company_logo, address, email, phone")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      } else {
        // Profile doesn't exist - create one for this user
        const { error: createError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email || "",
            plan_type: 'trial',
            is_premium: true,
            trial_end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          });
        
        if (!createError) {
          setProfile({
            email: user.email,
          });
        }
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


  const handleDownloadPdf = async () => {
    if (!invoice) return;
    setDownloadingPdf(true);
    try {
      const blob = await generateInvoicePdf(invoice, profile || {});
      downloadPdf(blob, `Invoice-${invoice.invoice_number}.pdf`);
      toast({
        title: "PDF Downloaded",
        description: "Invoice PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF.",
        variant: "destructive",
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
      case "sent":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "overdue":
        return "bg-red-500/10 text-red-600 border-red-200";
      case "draft":
        return "bg-muted text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground border-border";
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Invoice not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/invoices")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {invoice.invoice_number}
                </h1>
                <Badge variant="outline" className={getStatusColor(invoice.status)}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Created {format(new Date(invoice.issue_date), "MMM d, yyyy")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
            >
              {downloadingPdf ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download
            </Button>
            <ShareInvoiceDialog invoice={invoice} company={profile || {}} />
            <Button variant="ghost" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</p>
              <p className="text-xl sm:text-2xl font-bold text-primary mt-1">
                {getCurrencySymbol(invoice.currency)}{Number(invoice.total).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Paid</p>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-1">
                {getCurrencySymbol(invoice.currency)}{totalPaid.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Due</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-600 mt-1">
                {getCurrencySymbol(invoice.currency)}{amountDue.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Due Date</p>
              <p className="text-lg sm:text-xl font-semibold mt-1">
                {format(new Date(invoice.due_date), "MMM d")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* From/To Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  {/* From */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">From</span>
                    </div>
                    {profile?.company_logo && (
                      <img
                        src={profile.company_logo}
                        alt={profile.company_name || "Company Logo"}
                        className="h-10 w-auto object-contain mb-2"
                      />
                    )}
                    <p className="font-semibold">{profile?.company_name || "Your Company"}</p>
                    {profile?.email && (
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    )}
                    {profile?.phone && (
                      <p className="text-sm text-muted-foreground">{profile.phone}</p>
                    )}
                    {profile?.address && (
                      <p className="text-sm text-muted-foreground">{profile.address}</p>
                    )}
                    {(!profile?.company_name && !profile?.address) && (
                      <p className="text-xs text-amber-600 mt-2">
                        Update your company info when creating a new invoice
                      </p>
                    )}
                  </div>

                  {/* To */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bill To</span>
                    </div>
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
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Items</CardTitle>
                  <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Global</div>
                      {currencies.filter(c => c.region === 'global').map((curr) => (
                        <SelectItem key={curr.code} value={curr.code} className="text-xs">
                          {curr.code} - {curr.symbol}
                        </SelectItem>
                      ))}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">African</div>
                      {currencies.filter(c => c.region === 'africa').map((curr) => (
                        <SelectItem key={curr.code} value={curr.code} className="text-xs">
                          {curr.code} - {curr.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Description</TableHead>
                        <TableHead className="text-right font-semibold w-20">Qty</TableHead>
                        <TableHead className="text-right font-semibold w-28">Price</TableHead>
                        <TableHead className="text-right font-semibold w-28">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.invoice_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{Number(item.quantity)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {getCurrencySymbol(displayCurrency)}{Number(item.unit_price).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {getCurrencySymbol(displayCurrency)}{Number(item.amount).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{getCurrencySymbol(displayCurrency)}{Number(invoice.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Tax ({Number(invoice.tax_rate)}%)</span>
                    <span>{getCurrencySymbol(displayCurrency)}{Number(invoice.tax_amount).toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between py-1 text-base font-bold">
                    <span>Total</span>
                    <span className="text-primary">{getCurrencySymbol(displayCurrency)}{Number(invoice.total).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {invoice.notes && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {invoice.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Invoice Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Invoice #</span>
                  <span className="text-sm font-medium">{invoice.invoice_number}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Issue Date</span>
                  <span className="text-sm font-medium">
                    {format(new Date(invoice.issue_date), "MMM d, yyyy")}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Due Date</span>
                  <span className="text-sm font-medium">
                    {format(new Date(invoice.due_date), "MMM d, yyyy")}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="outline" className={getStatusColor(invoice.status)}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            {invoice.payments.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {invoice.payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">
                            {getCurrencySymbol(displayCurrency)}{Number(payment.amount).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(payment.payment_date), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {payment.payment_method || "N/A"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Record Payment */}
            {invoice.status !== "paid" && amountDue > 0 && (
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount Due</p>
                      <p className="text-2xl font-bold text-primary">
                        {getCurrencySymbol(displayCurrency)}{amountDue.toFixed(2)}
                      </p>
                    </div>
                    <Button variant="outline" className="w-full">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Record Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
