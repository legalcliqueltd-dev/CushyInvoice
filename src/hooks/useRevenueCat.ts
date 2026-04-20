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

  const refetchOfferings = useCallback(async () => {
    if (!isIOSNative()) return null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      await initRevenueCat(user.id);
      const current = await getCurrentOffering();
      console.log("[RevenueCat] offering fetched:", {
        hasOffering: !!current,
        identifier: current?.identifier,
        packageCount: current?.availablePackages?.length ?? 0,
        packages: current?.availablePackages?.map((p: any) => ({
          id: p.identifier,
          type: p.packageType,
          productId: p.product?.identifier,
          price: p.product?.priceString,
        })),
      });
      setOffering(current);
      return current;
    } catch (err) {
      console.error("[RevenueCat] fetch offerings failed:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isIOSNative()) {
      setReady(true);
      return;
    }
    let cancelled = false;
    (async () => {
      // First attempt
      const first = await refetchOfferings();
      if (cancelled) return;
      // Auto-retry once after a short delay if no offering returned
      if (!first) {
        await new Promise((r) => setTimeout(r, 1500));
        if (cancelled) return;
        await refetchOfferings();
      }
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
  }, [refetchOfferings]);

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

  return { ready, offering, loading, purchase, restore, refetchOfferings, isIOSNative: isIOSNative() };
};
