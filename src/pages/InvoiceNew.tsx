import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, CalendarIcon, Loader2, Building2, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { currencies, getCurrencySymbol } from "@/lib/currencies";
import { LogoUploadDialog } from "@/components/LogoUploadDialog";

interface Client {
  id: string;
  name: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
}

interface Template {
  id: string;
  template_name: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  layout_style: string;
  is_default: boolean;
}

interface LineItem {
  id: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface CompanyInfo {
  company_name: string;
  company_logo: string | null;
  email: string;
  phone: string;
  address: string;
}

const clientSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email").max(255),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
});

export default function InvoiceNew() {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [issueDate, setIssueDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  );
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      description: "",
      quantity: 1,
      unit_price: 0,
      amount: 0,
    },
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [notes, setNotes] = useState("");
  const [logoBgColor, setLogoBgColor] = useState("#ffffff");
  const [loading, setLoading] = useState(false);
  const [newClientDialog, setNewClientDialog] = useState(false);
  const [newClientData, setNewClientData] = useState({ name: "", email: "", phone: "", address: "" });
  
  // Company info state
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    company_name: "",
    company_logo: null,
    email: "",
    phone: "",
    address: "",
  });
  const [logoUploadDialog, setLogoUploadDialog] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchClients();
    fetchProducts();
    fetchProfileDefaults();
    fetchTemplates();
  }, []);

  const fetchProfileDefaults = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("default_tax_rate, default_currency, company_name, company_logo, email, phone, address")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTaxRate(Number(data.default_tax_rate) || 0);
        setCurrency(data.default_currency || "USD");
        setCompanyInfo({
          company_name: data.company_name || "",
          company_logo: data.company_logo || null,
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error fetching profile defaults:", error);
      }
    }
  };

  const handleLogoUpload = async (blob: Blob) => {
    setUploadingLogo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileName = `${user.id}/logo-${Date.now()}.png`;
      
      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(fileName, blob, { 
          contentType: "image/png",
          upsert: true 
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("company-logos")
        .getPublicUrl(fileName);

      const logoUrl = urlData.publicUrl;

      // Update profile with new logo URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ company_logo: logoUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setCompanyInfo(prev => ({ ...prev, company_logo: logoUrl }));
      toast({ title: "Logo uploaded successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("profiles")
        .update({ company_logo: null })
        .eq("id", user.id);

      setCompanyInfo(prev => ({ ...prev, company_logo: null }));
      toast({ title: "Logo removed" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove logo",
        variant: "destructive",
      });
    }
  };

  const saveCompanyInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: companyInfo.company_name,
          email: companyInfo.email,
          phone: companyInfo.phone,
          address: companyInfo.address,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast({ title: "Company info saved" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save company info",
        variant: "destructive",
      });
    }
  };

  const fetchClients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error fetching clients:", error);
      }
    }
  };

  const fetchProducts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error fetching products:", error);
      }
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("invoice_templates")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
      
      const defaultTemplate = data?.find(t => t.is_default);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error fetching templates:", error);
      }
    }
  };

  const handleAddClient = async () => {
    try {
      const validation = clientSchema.safeParse(newClientData);
      if (!validation.success) {
        toast({
          title: "Validation Error",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("clients")
        .insert([{
          name: validation.data.name,
          email: validation.data.email,
          phone: validation.data.phone,
          address: validation.data.address,
          user_id: user.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Client added successfully" });
      setClients([...clients, { id: data.id, name: data.name, email: data.email }]);
      setSelectedClientId(data.id);
      setNewClientDialog(false);
      setNewClientData({ name: "", email: "", phone: "", address: "" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        description: "",
        quantity: 1,
        unit_price: 0,
        amount: 0,
      },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) {
      toast({
        title: "Warning",
        description: "Invoice must have at least one line item",
        variant: "destructive",
      });
      return;
    }
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // Recalculate amount
          if (field === "quantity" || field === "unit_price") {
            updated.amount = Number(updated.quantity) * Number(updated.unit_price);
          }
          return updated;
        }
        return item;
      })
    );
  };

  const selectProduct = (lineItemId: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    updateLineItem(lineItemId, "product_id", productId);
    updateLineItem(lineItemId, "description", product.name);
    updateLineItem(lineItemId, "unit_price", Number(product.price));
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + Number(item.amount), 0);
    const tax = subtotal * (Number(taxRate) / 100);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotals();

  const generateInvoiceNumber = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get the latest invoice number for this user
    const { data, error } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error && error.code !== "PGRST116") throw error;

    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].invoice_number.replace(/\D/g, "")) || 0;
      return `INV-${String(lastNumber + 1).padStart(5, "0")}`;
    }

    return "INV-00001";
  };

  const handleSave = async (status: "draft" | "sent") => {
    if (!selectedClientId) {
      toast({
        title: "Validation Error",
        description: "Please select a client",
        variant: "destructive",
      });
      return;
    }

    if (lineItems.some((item) => !item.description || item.quantity <= 0 || item.unit_price < 0)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all line item details",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Auto-save company info to profile before creating invoice
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          company_name: companyInfo.company_name,
          email: companyInfo.email,
          phone: companyInfo.phone,
          address: companyInfo.address,
        })
        .eq("id", user.id);

      if (profileError) {
        console.error("Error saving company info:", profileError);
      }

      const invoiceNumber = await generateInvoiceNumber();

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          client_id: selectedClientId,
          template_id: selectedTemplateId || null,
          invoice_number: invoiceNumber,
          issue_date: format(issueDate, "yyyy-MM-dd"),
          due_date: format(dueDate, "yyyy-MM-dd"),
          status,
          currency,
          subtotal,
          tax_rate: taxRate,
          tax_amount: tax,
          total,
          notes,
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(
          lineItems.map((item) => ({
            invoice_id: invoice.id,
            product_id: item.product_id || null,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            amount: item.amount,
          }))
        );

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: `Invoice ${status === "draft" ? "saved as draft" : "sent"}`,
      });

      navigate(`/invoices/${invoice.id}`);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error saving invoice:", error);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to save invoice",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
          <p className="text-muted-foreground">Fill in the details below</p>
        </div>

        {/* Company Info - appears on invoice PDF */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Your Company Info
            </CardTitle>
            <p className="text-sm text-muted-foreground">This information will appear on your invoice</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Logo Section */}
              <div className="flex flex-col items-center gap-3">
                <div
                  className="relative w-24 h-24 rounded-xl flex items-center justify-center overflow-hidden border-2 border-border"
                  style={{ backgroundColor: logoBgColor }}
                >
                  {companyInfo.company_logo ? (
                    <>
                      <img
                        src={companyInfo.company_logo}
                        alt="Company Logo"
                        className="w-full h-full object-contain p-1"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={handleRemoveLogo}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLogoUploadDialog(true)}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {companyInfo.company_logo ? "Change" : "Upload"}
                  </Button>
                  <div className="flex items-center gap-1">
                    <Label htmlFor="logoBgColor" className="text-xs text-muted-foreground sr-only">BG</Label>
                    <input
                      id="logoBgColor"
                      type="color"
                      value={logoBgColor}
                      onChange={(e) => setLogoBgColor(e.target.value)}
                      className="w-7 h-7 rounded-md border border-border cursor-pointer p-0.5"
                      title="Logo background color"
                    />
                  </div>
                </div>
              </div>

              {/* Company Details */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Company Name</Label>
                  <Input
                    value={companyInfo.company_name}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="Your Company Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={companyInfo.email}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="company@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 234 567 890"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Address</Label>
                  <Input
                    value={companyInfo.address}
                    onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Business St, City, Country"
                  />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="sm"
                    onClick={saveCompanyInfo}
                  >
                    Save Company Info
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <LogoUploadDialog
          open={logoUploadDialog}
          onOpenChange={setLogoUploadDialog}
          onUpload={handleLogoUpload}
        />

        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label>Client *</Label>
              <div className="flex gap-2">
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={newClientDialog} onOpenChange={setNewClientDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Client</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input
                          value={newClientData.name}
                          onChange={(e) =>
                            setNewClientData({ ...newClientData, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={newClientData.email}
                          onChange={(e) =>
                            setNewClientData({ ...newClientData, email: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          value={newClientData.phone}
                          onChange={(e) =>
                            setNewClientData({ ...newClientData, phone: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input
                          value={newClientData.address}
                          onChange={(e) =>
                            setNewClientData({ ...newClientData, address: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" onClick={() => setNewClientDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddClient}>Add Client</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Currency Selection */}
            <div className="space-y-2">
              <Label>Currency *</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Global</div>
                  {currencies.filter(c => c.region === 'global').map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.code} - {curr.name} ({curr.symbol})
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground mt-2">African</div>
                  {currencies.filter(c => c.region === 'africa').map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.code} - {curr.name} ({curr.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {templates.length > 0 && (
              <div className="space-y-2">
                <Label>Template (Optional)</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.template_name} {template.is_default && "(Default)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !issueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {issueDate ? format(issueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={issueDate}
                      onSelect={(date) => date && setIssueDate(date)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={(date) => date && setDueDate(date)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lineItems.map((item, index) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Item {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Product (Optional)</Label>
                    <Select
                      value={item.product_id || ""}
                      onValueChange={(value) => selectProduct(item.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} - ${Number(product.price).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem(item.id, "description", e.target.value)
                      }
                      placeholder="Description of item"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity}
                      onChange={(e) =>
                        updateLineItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Unit Price *</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) =>
                        updateLineItem(item.id, "unit_price", parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      value={`${getCurrencySymbol(currency)}${item.amount.toFixed(2)}`}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button variant="outline" onClick={addLineItem} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Line Item
            </Button>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardHeader>
            <CardTitle>Totals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">{getCurrencySymbol(currency)}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({taxRate}%):</span>
                <span className="font-medium">{getCurrencySymbol(currency)}{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{getCurrencySymbol(currency)}{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes here..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={() => navigate("/invoices")} disabled={loading}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save as Draft
          </Button>
          <Button onClick={() => handleSave("sent")} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save & Send
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
