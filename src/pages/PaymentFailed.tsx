import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const PaymentFailed = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-destructive/20">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-4 animate-pulse">
              <XCircle className="h-14 w-14 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">Payment Not Completed</CardTitle>
          <CardDescription className="text-base">
            Your payment was canceled and no charges were made to your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold">Common reasons:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Payment window was closed</li>
              <li>• Payment details were incorrect</li>
              <li>• Transaction was canceled</li>
            </ul>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Need help? Contact our support team at support@cushyinvoice.com
          </p>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => navigate("/subscribe")} 
              className="w-full"
              size="lg"
            >
              Try Again
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFailed;
