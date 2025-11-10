import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const invoiceId = searchParams.get("invoice_id");
  const sessionId = searchParams.get("session_id");

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto py-12">
        <Card>
          <CardHeader>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-success/10 p-3">
                <CheckCircle className="h-12 w-12 text-success" />
              </div>
              <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground">
              Your payment has been processed successfully. The invoice will be updated shortly.
            </p>
            
            {sessionId && (
              <div className="text-sm text-muted-foreground">
                <p>Transaction ID: {sessionId}</p>
              </div>
            )}

            <div className="flex gap-3 justify-center">
              {invoiceId && (
                <Button onClick={() => navigate(`/invoices/${invoiceId}`)}>
                  View Invoice
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate("/invoices")}>
                Back to Invoices
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
