import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PlanLimits {
  canCreateInvoice: boolean;
  canCreateClient: boolean;
  isPremium: boolean;
  planType: string;
  invoicesUsed: number;
  invoicesLimit: number;
  clientsUsed: number;
  clientsLimit: number;
  trialDaysLeft: number | null;
}

export const usePlanLimits = () => {
  const [limits, setLimits] = useState<PlanLimits>({
    canCreateInvoice: true,
    canCreateClient: true,
    isPremium: true,
    planType: 'trial',
    invoicesUsed: 0,
    invoicesLimit: 5,
    clientsUsed: 0,
    clientsLimit: 3,
    trialDaysLeft: null,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkLimits();
  }, []);

  const checkLimits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan_type, is_premium, trial_end_date, invoices_this_month, clients_count')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) return;

      // Calculate trial days left
      let trialDaysLeft = null;
      if (profile.plan_type === 'trial' && profile.trial_end_date) {
        const trialEnd = new Date(profile.trial_end_date);
        const now = new Date();
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        trialDaysLeft = daysLeft > 0 ? daysLeft : 0;
      }

      const isPremium = profile.is_premium || profile.plan_type === 'premium';
      const invoicesLimit = isPremium ? Infinity : 5;
      const clientsLimit = isPremium ? Infinity : 3;

      setLimits({
        canCreateInvoice: isPremium || (profile.invoices_this_month || 0) < 5,
        canCreateClient: isPremium || (profile.clients_count || 0) < 3,
        isPremium,
        planType: profile.plan_type || 'free',
        invoicesUsed: profile.invoices_this_month || 0,
        invoicesLimit,
        clientsUsed: profile.clients_count || 0,
        clientsLimit,
        trialDaysLeft,
      });
    } catch (error) {
      console.error('Error checking plan limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkInvoiceLimit = async (): Promise<boolean> => {
    if (limits.isPremium) return true;
    
    if (!limits.canCreateInvoice) {
      toast({
        title: "Invoice Limit Reached",
        description: "You've reached the free plan limit of 5 invoices per month. Upgrade to Premium for unlimited invoices.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const checkClientLimit = async (): Promise<boolean> => {
    if (limits.isPremium) return true;
    
    if (!limits.canCreateClient) {
      toast({
        title: "Client Limit Reached",
        description: "You've reached the free plan limit of 3 clients. Upgrade to Premium for unlimited clients.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const incrementInvoiceCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || limits.isPremium) return;

    await supabase.rpc('increment_invoice_count', { user_id: user.id });
    await checkLimits();
  };

  const incrementClientCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || limits.isPremium) return;

    await supabase
      .from('profiles')
      .update({ clients_count: (limits.clientsUsed || 0) + 1 })
      .eq('id', user.id);
    
    await checkLimits();
  };

  return {
    limits,
    loading,
    checkInvoiceLimit,
    checkClientLimit,
    incrementInvoiceCount,
    incrementClientCount,
    refreshLimits: checkLimits,
  };
};
