import { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Crown, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SubscriptionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  message?: string;
}

export const SubscriptionGuard = ({ 
  children, 
  fallback,
  message = "This feature requires a premium subscription"
}: SubscriptionGuardProps) => {
  const { subscription, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!subscription.subscribed) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Alert className="neo-card-subtle border-primary/20">
        <Crown className="h-5 w-5 text-primary" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <span className="flex-1">{message}</span>
          <Button
            size="sm"
            onClick={() => navigate('/subscribe')}
            className="neo-btn-subtle"
          >
            Upgrade Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};
