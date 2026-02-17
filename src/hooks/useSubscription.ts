import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionData {
  subscribed: boolean;
  status: string;
  current_plan: string | null;
  subscription_end: string | null;
  trial_end: string | null;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionData>({
    subscribed: false,
    status: 'inactive',
    current_plan: null,
    subscription_end: null,
    trial_end: null,
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

    // Set up interval to check subscription every minute
    const interval = setInterval(() => {
      checkSubscription();
    }, 60000); // 60 seconds

    // Listen for auth state changes
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
    startCheckout,
  };
};
