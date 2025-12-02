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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_type, trial_end_date')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!profile) return;

      if (profile.plan_type === 'trial' && profile.trial_end_date) {
        const trialEnd = new Date(profile.trial_end_date);
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
