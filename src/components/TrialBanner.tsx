import { useSubscription } from "@/hooks/useSubscription";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const TrialBanner = () => {
  const { subscription, trialExpired } = useSubscription();
  const navigate = useNavigate();

  if (subscription.subscribed) return null;

  // Trial expired state
  if (trialExpired) {
    return (
      <Alert className="mb-6 bg-destructive/10 border-destructive/20">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>
            Your trial has expired. Subscribe to continue downloading and sharing invoices.
          </span>
          <Button size="sm" onClick={() => navigate("/subscribe")} className="shrink-0">
            Upgrade Now
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Active trial state
  if (!subscription.trial_end) return null;

  const trialEnd = new Date(subscription.trial_end);
  const now = new Date();
  const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) return null;

  return (
    <Alert className="mb-6 bg-primary/10 border-primary/20">
      <Clock className="h-4 w-4" />
      <AlertDescription>
        You have <strong>{daysLeft}</strong> {daysLeft === 1 ? "day" : "days"} left in your free trial.
        Your subscription will automatically start after the trial period.
      </AlertDescription>
    </Alert>
  );
};
