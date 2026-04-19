/**
 * RevenueCat client wrapper for iOS native in-app purchases.
 * Web/Android fall back to Stripe/Paystack.
 */

let initialized = false;
let initPromise: Promise<void> | null = null;

export const isIOSNative = (): boolean => {
  const cap = (window as any).Capacitor;
  return cap?.isNativePlatform?.() && cap?.getPlatform?.() === "ios";
};

const IOS_API_KEY = "appl_cZFOmclzXEcSYxdysAsPeeNGlGu";

/**
 * Initialize RevenueCat SDK. Safe to call multiple times.
 */
export const initRevenueCat = async (userId: string): Promise<void> => {
  if (!isIOSNative()) return;
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { Purchases, LOG_LEVEL } = await import("@revenuecat/purchases-capacitor");
    await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
    await Purchases.configure({ apiKey: IOS_API_KEY, appUserID: userId });
    initialized = true;
  })();

  return initPromise;
};

/**
 * Fetch the current offering with available packages.
 */
export const getCurrentOffering = async () => {
  if (!isIOSNative()) return null;
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
};

/**
 * Purchase a package. Returns customer info on success.
 */
export const purchasePackage = async (pkg: any) => {
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  const result = await Purchases.purchasePackage({ aPackage: pkg });
  return result;
};

/**
 * Restore previous purchases (required by Apple).
 */
export const restorePurchases = async () => {
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  const result = await Purchases.restorePurchases();
  return result;
};

/**
 * Get current entitlement status.
 */
export const getCustomerInfo = async () => {
  if (!isIOSNative()) return null;
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  const result = await Purchases.getCustomerInfo();
  return result.customerInfo;
};

/**
 * Check if user has the "premium" entitlement active.
 */
export const hasPremiumEntitlement = (customerInfo: any): boolean => {
  if (!customerInfo) return false;
  const entitlements = customerInfo.entitlements?.active ?? {};
  return !!entitlements["premium"];
};
