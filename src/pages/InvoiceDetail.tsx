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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Trash2,
  ArrowLeft,
  Building2,
  FileText,
  DollarSign,
  Pencil,
  Eye,
  ListChecks,
} from "lucide-react";
import { format } from "date-fns";
import { currencies, getCurrencySymbol } from "@/lib/currencies";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShareInvoiceDialog } from "@/components/ShareInvoiceDialog";
import { generateInvoicePdf, downloadPdf, savePdfToDevice } from "@/lib/generateInvoicePdf";
import { InvoicePreview } from "@/components/InvoicePreview";

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
  logo_bg_color?: string;
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
  bank_name?: string;
  bank_account_number?: string;
  bank_routing_code?: string;
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
  const [activeTab, setActiveTab] = useState("details");

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
        .maybeSingle();

      if (error) throw error;
      setInvoice(data);
      setDisplayCurrency(data?.currency || "USD");

      // Fetch profile for company info
      const { data: profileData } = await supabase
        .from("profiles")
        .select("company_name, company_logo, address, email, phone, bank_name, bank_account_number, bank_routing_code")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      } else {
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
      const filename = `Invoice-${invoice.invoice_number}.pdf`;
      
      const saved = await savePdfToDevice(blob, filename);
      if (saved) {
        toast({
          title: "PDF Saved",
          description: "Invoice saved to your device storage.",
        });
      } else {
        downloadPdf(blob, filename);
        toast({
          title: "PDF Downloaded",
          description: "Invoice PDF has been downloaded successfully.",
        });
      }
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

  const totalPaid = (invoice?.payments || []).reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );
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
      <div className="max-w-5xl mx-auto space-y-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("/invoices")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-3xl font-bold tracking-tight truncate">
                  {invoice.invoice_number}
                </h1>
                <Badge variant="outline" className={`${getStatusColor(invoice.status)} shrink-0`}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                Created {(() => { try { return format(new Date(invoice.issue_date), "MMM d, yyyy"); } catch { return invoice.issue_date; } })()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/invoices/${id}/edit`)}
            >
              <Pencil className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
            >
              {downloadingPdf ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-1" />
              )}
              <span className="hidden sm:inline">Download</span>
            </Button>
            <ShareInvoiceDialog invoice={invoice} company={profile || {}} />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 px-3 sm:px-6">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</p>
              <p className="text-base sm:text-2xl font-bold text-primary mt-1 truncate">
                {getCurrencySymbol(invoice.currency)}{Number(invoice.total).toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 px-3 sm:px-6">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Paid</p>
              <p className="text-base sm:text-2xl font-bold text-emerald-600 mt-1 truncate">
                {getCurrencySymbol(invoice.currency)}{totalPaid.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 px-3 sm:px-6">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Due</p>
              <p className="text-base sm:text-2xl font-bold text-amber-600 mt-1 truncate">
                {getCurrencySymbol(invoice.currency)}{amountDue.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 px-3 sm:px-6">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">Due Date</p>
              <p className="text-base sm:text-xl font-semibold mt-1 truncate">
                {(() => { try { return format(new Date(invoice.due_date), "MMM d"); } catch { return invoice.due_date; } })()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Details / Preview */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-xs">
            <TabsTrigger value="details" className="gap-2">
              <ListChecks className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="mt-6">
            <div className="overflow-x-auto">
              <InvoicePreview
                companyInfo={{
                  company_name: profile?.company_name || "",
                  company_logo: profile?.company_logo || null,
                  email: profile?.email || "",
                  phone: profile?.phone || "",
                  address: profile?.address || "",
                  bank_name: profile?.bank_name,
                  bank_account_number: profile?.bank_account_number,
                  bank_routing_code: profile?.bank_routing_code,
                }}
                client={{
                  name: invoice.clients.name,
                  email: invoice.clients.email,
                  phone: invoice.clients.phone,
                  address: invoice.clients.address,
                  city: invoice.clients.city,
                  state: invoice.clients.state,
                  zip_code: invoice.clients.zip_code,
                }}
                invoiceNumber={invoice.invoice_number}
                issueDate={new Date(invoice.issue_date)}
                dueDate={new Date(invoice.due_date)}
                lineItems={invoice.invoice_items}
                taxRate={Number(invoice.tax_rate)}
                currency={invoice.currency}
                notes={invoice.notes || ""}
                logoBgColor={invoice.logo_bg_color || "#ffffff"}
                status={invoice.status}
              />
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left Column - Invoice Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* From/To Section */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      {/* From */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">From</span>
                        </div>
                        {profile?.company_logo && (
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border border-border mb-2"
                            style={{ backgroundColor: invoice?.logo_bg_color || '#ffffff' }}
                          >
                            <img
                              src={profile.company_logo}
                              alt={profile.company_name || "Company Logo"}
                              className="w-full h-full object-contain p-0.5"
                            />
                          </div>
                        )}
                        <p className="font-semibold truncate">{profile?.company_name || "Your Company"}</p>
                        {profile?.email && (
                          <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                        )}
                        {profile?.phone && (
                          <p className="text-sm text-muted-foreground truncate">{profile.phone}</p>
                        )}
                        {profile?.address && (
                          <p className="text-sm text-muted-foreground break-words">{profile.address}</p>
                        )}
                        {(!profile?.company_name && !profile?.address) && (
                          <p className="text-xs text-amber-600 mt-2">
                            Update your company info when creating a new invoice
                          </p>
                        )}
                      </div>

                      {/* To */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bill To</span>
                        </div>
                        <p className="font-semibold truncate">{invoice.clients.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{invoice.clients.email}</p>
                        {invoice.clients.phone && (
                          <p className="text-sm text-muted-foreground truncate">{invoice.clients.phone}</p>
                        )}
                        {invoice.clients.address && (
                          <div className="text-sm text-muted-foreground">
                            <p className="break-words">{invoice.clients.address}</p>
                            {invoice.clients.city && (
                              <p className="truncate">
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
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-lg shrink-0">Items</CardTitle>
                      <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
                        <SelectTrigger className="w-[110px] h-8 text-xs">
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
                    <div className="rounded-lg border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold text-xs">Description</TableHead>
                            <TableHead className="text-right font-semibold text-xs w-12">Qty</TableHead>
                            <TableHead className="text-right font-semibold text-xs w-20">Price</TableHead>
                            <TableHead className="text-right font-semibold text-xs w-20">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invoice.invoice_items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium text-xs break-words max-w-[120px]">{item.description}</TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground">{Number(item.quantity)}</TableCell>
                              <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                                {getCurrencySymbol(displayCurrency)}{Number(item.unit_price).toFixed(2)}
                              </TableCell>
                              <TableCell className="text-right text-xs font-medium whitespace-nowrap">
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
                        <span className="whitespace-nowrap">{getCurrencySymbol(displayCurrency)}{Number(invoice.subtotal).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Tax ({Number(invoice.tax_rate)}%)</span>
                        <span className="whitespace-nowrap">{getCurrencySymbol(displayCurrency)}{Number(invoice.tax_amount).toFixed(2)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between py-1 text-base font-bold">
                        <span>Total</span>
                        <span className="text-primary whitespace-nowrap">{getCurrencySymbol(displayCurrency)}{Number(invoice.total).toFixed(2)}</span>
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
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
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
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm text-muted-foreground shrink-0">Invoice #</span>
                      <span className="text-sm font-medium truncate">{invoice.invoice_number}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm text-muted-foreground shrink-0">Issue Date</span>
                      <span className="text-sm font-medium whitespace-nowrap">
                        {format(new Date(invoice.issue_date), "MMM d, yyyy")}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm text-muted-foreground shrink-0">Due Date</span>
                      <span className="text-sm font-medium whitespace-nowrap">
                        {format(new Date(invoice.due_date), "MMM d, yyyy")}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-sm text-muted-foreground shrink-0">Status</span>
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
                          <div key={payment.id} className="flex justify-between items-center gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {getCurrencySymbol(displayCurrency)}{Number(payment.amount).toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(payment.payment_date), "MMM d, yyyy")}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs shrink-0">
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
                          <p className="text-xl sm:text-2xl font-bold text-primary truncate">
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
