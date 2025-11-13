import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Crown, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const UpgradeBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkIfShouldShow();
  }, []);

  const checkIfShouldShow = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_premium, plan_type')
        .eq('id', user.id)
        .single();
      
      if (!profile?.is_premium && profile?.plan_type !== 'trial') {
        setShowBanner(true);
      }
    } catch (error) {
      console.error("Error checking upgrade eligibility:", error);
    }
  };

  if (!showBanner || dismissed) return null;

  return (
    <Alert className="mb-6 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 relative">
      <Crown className="h-4 w-4 text-primary" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>
          <strong>Upgrade to Premium</strong> for unlimited invoices, clients, and no ads!
        </span>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={() => navigate('/subscribe')}
            className="bg-primary hover:bg-primary/90"
          >
            Upgrade Now
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
