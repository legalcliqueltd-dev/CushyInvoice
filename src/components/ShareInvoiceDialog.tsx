import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, MessageCircle, Mail, Copy, Download, Loader2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateInvoicePdf, downloadPdf } from "@/lib/generateInvoicePdf";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ShareInvoiceDialogProps {
  invoice: {
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
  };
  company: {
    company_name?: string;
    company_logo?: string;
    address?: string;
    email?: string;
    phone?: string;
  };
  locked?: boolean;
}

export function ShareInvoiceDialog({ invoice, company, locked = false }: ShareInvoiceDialogProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState(invoice.clients.email);

  const handleOpenChange = (newOpen: boolean) => {
    if (locked && newOpen) {
      navigate("/subscribe");
      return;
    }
    setOpen(newOpen);
  };

  const handleDownloadPdf = async () => {
    setLoading('download');
    try {
      const blob = await generateInvoicePdf(invoice, company);
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
      setLoading(null);
    }
  };

  const handleShareWhatsApp = async () => {
    setLoading('whatsapp');
    try {
      const blob = await generateInvoicePdf(invoice, company);
      
      // For WhatsApp, we'll share a link with the invoice details
      // since WhatsApp Web API doesn't support direct file sharing
      const text = `📄 *Invoice ${invoice.invoice_number}*\n\n*From:* ${company.company_name || 'Company'}\n*To:* ${invoice.clients.name}\n\n*Amount:* ${invoice.currency} ${invoice.total.toFixed(2)}\n*Due Date:* ${new Date(invoice.due_date).toLocaleDateString()}\n\nPlease find the invoice PDF attached.\nThank you for your business! 🙏`;
      
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
      
      // Also download the PDF so user can attach it manually
      downloadPdf(blob, `Invoice-${invoice.invoice_number}.pdf`);
      
      toast({
        title: "WhatsApp Opened",
        description: "PDF downloaded. You can attach it to your WhatsApp message.",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to prepare invoice for sharing.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleSendEmail = async () => {
    setLoading('email');
    try {
      const blob = await generateInvoicePdf(invoice, company);
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Pdf = base64data.split(',')[1];
        
        const { error } = await supabase.functions.invoke("send-invoice-email", {
          body: {
            invoiceId: invoice.id,
            pdfBase64: base64Pdf,
            recipientEmail,
          },
        });

        if (error) throw error;

        toast({
          title: "Email Sent",
          description: `Invoice PDF has been sent to ${recipientEmail}`,
        });
        setOpen(false);
      };
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email with PDF.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleCopyLink = async () => {
    setLoading('copy');
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Invoice link has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleNativeShare = async () => {
    setLoading('share');
    try {
      const blob = await generateInvoicePdf(invoice, company);
      const file = new File([blob], `Invoice-${invoice.invoice_number}.pdf`, { type: 'application/pdf' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Invoice ${invoice.invoice_number}`,
          text: `Invoice from ${company.company_name || 'Company'} - Total: ${invoice.currency} ${invoice.total.toFixed(2)}`,
          files: [file],
        });
        toast({
          title: "Shared",
          description: "Invoice shared successfully.",
        });
      } else {
        // Fallback: download PDF
        downloadPdf(blob, `Invoice-${invoice.invoice_number}.pdf`);
        toast({
          title: "PDF Downloaded",
          description: "Your device doesn't support direct sharing. PDF has been downloaded.",
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error);
        toast({
          title: "Error",
          description: "Failed to share invoice.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {locked ? <Lock className="h-4 w-4 mr-2 text-blue-500" /> : <Share2 className="h-4 w-4 mr-2" />}
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md neo-card-subtle">
        <DialogHeader>
          <DialogTitle>Share Invoice</DialogTitle>
          <DialogDescription>
            Share Invoice #{invoice.invoice_number} via your preferred method.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipient-email">Send to:</Label>
            <Input
              id="recipient-email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Enter recipient email"
            />
          </div>
          <Button
            variant="outline"
            className="w-full justify-start h-12"
            onClick={handleDownloadPdf}
            disabled={loading !== null}
          >
            {loading === 'download' ? (
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
            ) : (
              <Download className="h-5 w-5 mr-3" />
            )}
            <div className="text-left">
              <div className="font-medium">Download PDF</div>
              <div className="text-xs text-muted-foreground">Save invoice as PDF file</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-12"
            onClick={handleSendEmail}
            disabled={loading !== null}
          >
            {loading === 'email' ? (
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
            ) : (
              <Mail className="h-5 w-5 mr-3" />
            )}
            <div className="text-left">
              <div className="font-medium">Send via Email</div>
              <div className="text-xs text-muted-foreground">Send PDF to {invoice.clients.email}</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-12"
            onClick={handleShareWhatsApp}
            disabled={loading !== null}
          >
            {loading === 'whatsapp' ? (
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
            ) : (
              <MessageCircle className="h-5 w-5 mr-3" />
            )}
            <div className="text-left">
              <div className="font-medium">Share via WhatsApp</div>
              <div className="text-xs text-muted-foreground">Open WhatsApp with invoice details</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-12"
            onClick={handleCopyLink}
            disabled={loading !== null}
          >
            {loading === 'copy' ? (
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
            ) : (
              <Copy className="h-5 w-5 mr-3" />
            )}
            <div className="text-left">
              <div className="font-medium">Copy Link</div>
              <div className="text-xs text-muted-foreground">Copy invoice page URL</div>
            </div>
          </Button>

          {'share' in navigator && (
            <Button
              variant="default"
              className="w-full justify-start h-12"
              onClick={handleNativeShare}
              disabled={loading !== null}
            >
              {loading === 'share' ? (
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              ) : (
                <Share2 className="h-5 w-5 mr-3" />
              )}
              <div className="text-left">
                <div className="font-medium">More Options</div>
                <div className="text-xs text-muted-foreground">Share using device share menu</div>
              </div>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
