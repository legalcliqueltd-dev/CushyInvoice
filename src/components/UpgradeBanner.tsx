import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Crown, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

export const UpgradeBanner = () => {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const { subscription } = useSubscription();

  if (subscription.subscribed || dismissed) return null;

  return (
    <Alert className="mb-6 bg-gradient-to-r from-primary/10 via-primary/5 to-purple-500/10 border-primary/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
      <Crown className="h-5 w-5 text-primary relative z-10" />
      <AlertDescription className="flex items-center justify-between gap-4 relative z-10">
        <div className="flex-1">
          <div className="font-semibold text-foreground mb-1">
            ✨ Unlock Premium Features
          </div>
          <div className="text-sm text-muted-foreground">
            Unlimited invoices, no ads, advanced reports, and priority support
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={() => navigate('/subscribe')}
            className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-md"
          >
            Start Free Trial
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 p-0 hover:bg-background/50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
