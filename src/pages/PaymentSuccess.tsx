import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const invoiceId = searchParams.get("invoiceId") || searchParams.get("invoice_id");
  const sessionId = searchParams.get("session_id");
  const paystackProvider = searchParams.get("provider");
  const paystackRef = searchParams.get("reference") || searchParams.get("trxref");

  const isSubscription = (sessionId || paystackProvider === "paystack" || paystackRef) && !invoiceId;
  const isPublicInvoicePayment = !!invoiceId && !isSubscription;

  const content = (
    <div className="max-w-2xl mx-auto py-12">
      <Card className="border-success/20 shadow-xl">
        <CardHeader>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="rounded-full bg-gradient-to-br from-success/20 to-success/10 p-4 animate-pulse">
              <CheckCircle className="h-16 w-16 text-success" />
            </div>
            <CardTitle className="text-3xl font-bold">
              {isSubscription ? "🎉 Welcome to Premium!" : "✅ Payment Confirmed"}
            </CardTitle>
            {isSubscription && (
              <div className="bg-success/10 px-4 py-2 rounded-full">
                <span className="text-sm font-medium text-success">
                  Your 7-day free trial has started
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground text-lg">
            {isSubscription 
              ? "You now have full access to download, share, and send invoices. Enjoy all premium features!"
              : "Your payment has been processed successfully. The invoice will be updated shortly."}
          </p>
          
          {isSubscription && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="font-semibold">What's included:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Unlimited invoice downloads & PDF export</li>
                <li>✓ Share invoices via email, WhatsApp & more</li>
                <li>✓ Advanced reporting and analytics</li>
                <li>✓ Priority email support</li>
              </ul>
            </div>
          )}
          
          {sessionId && (
            <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
              <p>Transaction ID: {sessionId}</p>
            </div>
          )}

          <div className="flex gap-3 justify-center pt-4">
            {isSubscription ? (
              <Button 
                onClick={() => navigate("/dashboard")} 
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/90"
              >
                Start Creating Invoices
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : isPublicInvoicePayment ? (
              <p className="text-sm text-muted-foreground">You can close this page now. Thank you!</p>
            ) : (
              <Button variant="outline" onClick={() => navigate("/invoices")}>
                Back to Invoices
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isPublicInvoicePayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        {content}
      </div>
    );
  }

  return <DashboardLayout>{content}</DashboardLayout>;
}
