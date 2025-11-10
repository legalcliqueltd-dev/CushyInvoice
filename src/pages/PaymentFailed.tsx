import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const PaymentFailed = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl">Payment Canceled</CardTitle>
          <CardDescription>
            Your payment was not completed. No charges were made to your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            If you experienced any issues or have questions, please contact our support team.
          </p>

          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate("/subscribe")} className="w-full">
              Try Again
            </Button>
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentFailed;
