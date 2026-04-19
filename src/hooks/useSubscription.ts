import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isIOSNative, initRevenueCat, getCustomerInfo, hasPremiumEntitlement } from "@/lib/revenuecat";

interface SubscriptionData {
  subscribed: boolean;
  status: string;
  current_plan: string | null;
  subscription_end: string | null;
  trial_end: string | null;
  provider?: "stripe" | "paystack" | null;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionData>({
    subscribed: false,
    status: 'inactive',
    current_plan: null,
    subscription_end: null,
    trial_end: null,
    provider: null,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubscription({
          subscribed: false,
          status: 'inactive',
          current_plan: null,
          subscription_end: null,
          trial_end: null,
          provider: null,
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) throw error;
      
      if (data) {
        setSubscription({
          subscribed: data.subscribed || false,
          status: data.status || 'inactive',
          current_plan: data.current_plan || null,
          subscription_end: data.subscription_end || null,
          trial_end: data.trial_end || null,
          provider: data.provider || null,
        });
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error checking subscription:", error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const openCustomerPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error opening customer portal:", error);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to open billing portal",
        variant: "destructive",
      });
    }
  }, [toast]);

  const managePaystackSubscription = useCallback(async (action: "cancel" | "enable" | "update-card") => {
    try {
      const { data, error } = await supabase.functions.invoke("manage-paystack-subscription", {
        body: { action },
      });

      if (error) throw error;

      if (action === "update-card" && data?.url) {
        window.open(data.url, "_blank");
        return data;
      }

      toast({
        title: "Success",
        description: data?.message || `Subscription ${action}d successfully`,
      });

      // Refresh subscription status
      await checkSubscription();
      return data;
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error managing Paystack subscription:", error);
      }
      toast({
        title: "Error",
        description: error.message || `Failed to ${action} subscription`,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast, checkSubscription]);

  const startCheckout = useCallback(async (priceId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("create-subscription-session", {
        body: { priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error("Error creating checkout session:", error);
      }
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start checkout",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    checkSubscription();

    const interval = setInterval(() => {
      checkSubscription();
    }, 60000);

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => {
      clearInterval(interval);
      authSubscription.unsubscribe();
    };
  }, [checkSubscription]);

  const trialExpired = !subscription.subscribed && (
    !subscription.trial_end || new Date(subscription.trial_end).getTime() < Date.now()
  );

  const isActive = subscription.subscribed || (
    !!subscription.trial_end && new Date(subscription.trial_end).getTime() >= Date.now()
  );

  return {
    subscription,
    loading,
    isActive,
    trialExpired,
    checkSubscription,
    openCustomerPortal,
    managePaystackSubscription,
    startCheckout,
  };
};
