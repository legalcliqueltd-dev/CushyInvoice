import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Crown, X } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export const CompactUpgradeBanner = () => {
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem("upgrade-dismissed") === "true");
  const { subscription } = useSubscription();
  const navigate = useNavigate();

  if (dismissed || subscription.subscribed) return null;

  const trialDays = subscription.trial_end
    ? Math.max(0, Math.ceil((new Date(subscription.trial_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleDismiss = () => {
    sessionStorage.setItem("upgrade-dismissed", "true");
    setDismissed(true);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
      <Crown className="h-4 w-4 text-primary shrink-0" />
      <p className="text-xs text-foreground flex-1 truncate">
        {trialDays > 0 ? `${trialDays} days left in trial` : "Upgrade for unlimited invoices"}
      </p>
      <Button size="sm" className="h-7 text-xs px-3 shrink-0" onClick={() => navigate("/subscribe")}>
        Upgrade
      </Button>
      <button onClick={handleDismiss} className="p-1 rounded hover:bg-muted shrink-0">
        <X className="h-3 w-3 text-muted-foreground" />
      </button>
    </div>
  );
};
