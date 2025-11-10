import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock } from "lucide-react";

export const TrialBanner = () => {
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);

  useEffect(() => {
    checkTrialStatus();
  }, []);

  const checkTrialStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error || !data) return;

      if (data.status === "trialing" && data.trial_end) {
        const trialEnd = new Date(data.trial_end);
        const now = new Date();
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysLeft > 0) {
          setTrialDaysLeft(daysLeft);
        }
      }
    } catch (error) {
      console.error("Error checking trial status:", error);
    }
  };

  if (trialDaysLeft === null) return null;

  return (
    <Alert className="mb-6 bg-primary/10 border-primary/20">
      <Clock className="h-4 w-4" />
      <AlertDescription>
        You have <strong>{trialDaysLeft}</strong> {trialDaysLeft === 1 ? "day" : "days"} left in your free trial.
        Your subscription will automatically start after the trial period.
      </AlertDescription>
    </Alert>
  );
};
