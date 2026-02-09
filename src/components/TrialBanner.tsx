import { useSubscription } from "@/hooks/useSubscription";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock } from "lucide-react";

export const TrialBanner = () => {
  const { subscription } = useSubscription();

  if (subscription.subscribed || !subscription.trial_end) return null;

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
