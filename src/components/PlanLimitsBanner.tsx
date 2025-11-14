import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Crown, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

export const PlanLimitsBanner = () => {
  const [invoicesUsed, setInvoicesUsed] = useState(0);
  const [clientsUsed, setClientsUsed] = useState(0);
  const { subscription, loading } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    checkPlanLimits();
  }, []);

  const checkPlanLimits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('invoices_this_month, clients_count')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      setInvoicesUsed(profile.invoices_this_month || 0);
      setClientsUsed(profile.clients_count || 0);
    } catch (error) {
      console.error("Error checking plan limits:", error);
    }
  };

  // Don't show during loading or for subscribed users
  if (loading || subscription.subscribed) return null;

  const invoiceLimit = 5;
  const clientLimit = 3;
  const invoiceProgress = (invoicesUsed / invoiceLimit) * 100;
  const clientProgress = (clientsUsed / clientLimit) * 100;

  return (
    <Card className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-lg">Free Plan</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Invoices this month</span>
                <span className="text-sm font-medium">{invoicesUsed} / {invoiceLimit}</span>
              </div>
              <Progress value={invoiceProgress} className="h-2" />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Clients</span>
                <span className="text-sm font-medium">{clientsUsed} / {clientLimit}</span>
              </div>
              <Progress value={clientProgress} className="h-2" />
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-3">
            Upgrade to Premium for unlimited invoices, clients, and access to premium features.
          </p>
        </div>

        <Button onClick={() => navigate("/subscribe")} size="lg" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Upgrade Now
        </Button>
      </div>
    </Card>
  );
};
