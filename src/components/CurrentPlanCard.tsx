import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Zap, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

export const CurrentPlanCard = () => {
  const navigate = useNavigate();
  const { subscription, trialExpired } = useSubscription();
  const [isIOSNative, setIsIOSNative] = useState(false);

  useEffect(() => {
    const cap = (window as any).Capacitor;
    if (cap?.getPlatform?.() === "ios" && cap?.isNativePlatform?.()) {
      setIsIOSNative(true);
    }
  }, []);

  // Determine plan label + status detail
  let planLabel = "Free Trial";
  let statusDetail = "";
  let Icon = Sparkles;
  let isPremium = false;

  if (subscription.subscribed) {
    isPremium = true;
    Icon = Crown;
    const plan = (subscription.current_plan || "").toLowerCase();
    if (plan.includes("year") || plan.includes("annual")) {
      planLabel = "Premium Yearly";
    } else if (plan.includes("month")) {
      planLabel = "Premium Monthly";
    } else {
      planLabel = "Premium";
    }
    if (subscription.subscription_end) {
      const d = new Date(subscription.subscription_end);
      statusDetail = `Renews ${d.toLocaleDateString()}`;
    } else {
      statusDetail = "Active subscription";
    }
  } else if (trialExpired) {
    planLabel = "Trial Expired";
    statusDetail = "Upgrade to continue using premium features";
    Icon = Zap;
  } else if (subscription.trial_end) {
    const trialEnd = new Date(subscription.trial_end);
    const daysLeft = Math.max(
      0,
      Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
    statusDetail =
      daysLeft === 1 ? "1 day left in trial" : `${daysLeft} days left in trial`;
    Icon = Sparkles;
  } else {
    planLabel = "Free";
    statusDetail = "Upgrade to unlock premium features";
    Icon = Zap;
  }

  const handleManage = async () => {
    if (isIOSNative) {
      try {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: "itms-apps://apps.apple.com/account/subscriptions" });
      } catch {
        navigate("/subscribe");
      }
      return;
    }
    navigate("/settings?tab=billing");
  };

  return (
    <Card className="neo-card-subtle">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground break-words">{planLabel}</p>
            {statusDetail && (
              <p className="text-xs text-muted-foreground break-words">{statusDetail}</p>
            )}
          </div>
          {isPremium ? (
            <Button size="sm" variant="outline" onClick={handleManage} className="shrink-0">
              Manage
            </Button>
          ) : (
            <Button size="sm" onClick={() => navigate("/subscribe")} className="shrink-0">
              Upgrade
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};