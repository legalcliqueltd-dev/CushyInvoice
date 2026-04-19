import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  isIOSNative,
  initRevenueCat,
  getCurrentOffering,
  purchasePackage,
  restorePurchases,
  hasPremiumEntitlement,
} from "@/lib/revenuecat";

export const useRevenueCat = () => {
  const [ready, setReady] = useState(false);
  const [offering, setOffering] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isIOSNative()) {
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        await initRevenueCat(user.id);
        const current = await getCurrentOffering();
        if (!cancelled) {
          setOffering(current);
          setReady(true);
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error("[RevenueCat] init failed:", err);
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const syncToBackend = useCallback(async () => {
    try {
      await supabase.functions.invoke("revenuecat-sync");
    } catch (err) {
      if (import.meta.env.DEV) console.error("[RevenueCat] sync failed:", err);
    }
  }, []);

  const purchase = useCallback(async (pkg: any) => {
    setLoading(true);
    try {
      const result = await purchasePackage(pkg);
      const isPremium = hasPremiumEntitlement(result.customerInfo);
      if (isPremium) await syncToBackend();
      return { success: isPremium, customerInfo: result.customerInfo };
    } finally {
      setLoading(false);
    }
  }, [syncToBackend]);

  const restore = useCallback(async () => {
    setLoading(true);
    try {
      const result = await restorePurchases();
      const isPremium = hasPremiumEntitlement(result.customerInfo);
      if (isPremium) await syncToBackend();
      return { success: isPremium, customerInfo: result.customerInfo };
    } finally {
      setLoading(false);
    }
  }, [syncToBackend]);

  return { ready, offering, loading, purchase, restore, isIOSNative: isIOSNative() };
};
