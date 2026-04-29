import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Zap, Star, Shield, CreditCard, Globe, FlaskConical, RefreshCw, ArrowLeft, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { useRevenueCat } from "@/hooks/useRevenueCat";

type PaymentProvider = "stripe" | "paystack";

const PLANS = [
  {
    id: "monthly",
    name: "Monthly Plan",
    subtitle: "Perfect for freelancers",
    stripe: {
      price: "$2.99",
      period: "/month",
      priceId: "price_1SSKe7RWxKms6a9XPEoka2SG",
    },
    paystack: {
      price: "₦3,900",
      period: "/month",
      planCode: "PLN_g4lw65mt3lnj6py",
      amountInKobo: 390000,
    },
    icon: Zap,
    features: [
      "7-day free trial",
      "Unlimited invoices",
      "Client management",
      "Payment tracking",
      "PDF download & export",
      "Email & WhatsApp delivery",
      "Basic reporting",
    ],
  },
  {
    id: "yearly",
    name: "Yearly Plan",
    subtitle: "Best value for growing businesses",
    stripe: {
      price: "$23.88",
      period: "/year",
      priceId: "price_1SSKeIRWxKms6a9XncKq0Ixm",
    },
    paystack: {
      price: "₦31,200",
      period: "/year",
      planCode: "PLN_xb5byfwpuvqvs5z",
      amountInKobo: 3120000,
    },
    icon: Star,
    features: [
      "7-day free trial",
      "All Monthly features",
      "Priority support",
      "Advanced reporting",
      "Custom branding",
      "API access",
      "Save 33%",
    ],
    popular: true,
  },
];

const Subscribe = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [provider, setProvider] = useState<PaymentProvider>("stripe");
  const [isIOSNative] = useState<boolean>(() => {
    const cap = (window as any).Capacitor;
    const platform = cap?.getPlatform?.();
    return platform === "ios" || platform === "ipad" || (cap?.isNativePlatform?.() ?? false);
  });
  const [testEmail, setTestEmail] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const rc = useRevenueCat();

  useEffect(() => {
    const checkTestUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email === "akebinary@gmail.com") {
        setTestEmail(user.email);
      }
    };
    checkTestUser();
  }, []);

  const handleTestPayment = async () => {
    try {
      setLoading("test");
      const { data, error } = await supabase.functions.invoke("test-payment");
      if (error) throw error;
      toast({
        title: "Test Payment Activated",
        description: data?.message || "Premium access granted for 24 hours",
      });
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Test payment failed",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const openPaymentUrl = async (url: string) => {
    const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
    if (isNative) {
      try {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url });
      } catch {
        window.location.href = url;
      }
    } else {
      window.open(url, "_blank");
    }
  };

  /** iOS in-app purchase via RevenueCat */
  const handleIOSPurchase = async (planId: string) => {
    if (!rc.offering) {
      toast({
        title: "Unavailable",
        description: "Subscription products are not yet configured. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    // Match package by identifier — RevenueCat standard: $rc_monthly, $rc_annual
    const targetId = planId === "yearly" ? "$rc_annual" : "$rc_monthly";
    const pkg =
      rc.offering.availablePackages.find((p: any) => p.identifier === targetId) ||
      rc.offering.availablePackages.find((p: any) =>
        planId === "yearly" ? p.packageType === "ANNUAL" : p.packageType === "MONTHLY"
      );

    if (!pkg) {
      toast({
        title: "Plan unavailable",
        description: "This plan is not available right now.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(planId);
      const result = await rc.purchase(pkg);
      if (result.success) {
        toast({ title: "Welcome to Premium!", description: "Your subscription is now active." });
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        toast({
          title: "Purchase incomplete",
          description: "We couldn't verify your subscription. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      // User cancelled is not an error
      if (err?.code === "1" || err?.userCancelled) {
        return;
      }
      toast({
        title: "Purchase failed",
        description: err?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading("restore");
      const result = await rc.restore();
      if (result.success) {
        toast({ title: "Purchases restored", description: "Your subscription is active." });
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        toast({
          title: "No purchases found",
          description: "We couldn't find an active subscription on this Apple ID.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Restore failed",
        description: err?.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const handleSubscribe = async (planId: string) => {
    // iOS native → use RevenueCat in-app purchase
    if (isIOSNative) {
      await handleIOSPurchase(planId);
      return;
    }

    try {
      setLoading(planId);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const plan = PLANS.find((p) => p.id === planId);
      if (!plan) throw new Error("Plan not found");

      if (provider === "stripe") {
        const { data, error } = await supabase.functions.invoke("create-subscription-session", {
          body: { priceId: plan.stripe.priceId },
        });
        if (error) throw error;
        if (data?.url) await openPaymentUrl(data.url);
      } else {
        const { data, error } = await supabase.functions.invoke("create-paystack-subscription", {
          body: { planCode: plan.paystack.planCode, amount: plan.paystack.amountInKobo },
        });
        if (error) throw error;
        if (data?.url) await openPaymentUrl(data.url);
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start checkout",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
      {/* Back arrow */}
      <button
        onClick={() => navigate(-1)}
        aria-label="Go back"
        className="fixed left-4 top-[calc(env(safe-area-inset-top)+1rem)] z-50 h-10 w-10 rounded-full bg-card neo-card-subtle flex items-center justify-center text-foreground hover:bg-muted transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="max-w-4xl w-full mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full neo-card-subtle">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Start Your Free Trial Today</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free with 7 days trial. Upgrade anytime for unlimited invoices and premium features.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-success" />
              <span>Secure payments</span>
            </div>
          </div>
        </div>

        {/* Payment Provider Toggle — hidden on iOS */}
        {!isIOSNative && (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-muted neo-card-subtle">
              <button
                onClick={() => setProvider("stripe")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  provider === "stripe"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span>Stripe (International)</span>
              </button>
              <button
                onClick={() => setProvider("paystack")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  provider === "paystack"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Globe className="h-4 w-4" />
                <span>Paystack (Africa)</span>
              </button>
            </div>
          </div>
        )}


        {/* iOS App Store Notice */}
        {isIOSNative && (
          <div className="neo-card-subtle rounded-xl bg-card p-4 text-center space-y-2">
            <div className="inline-flex items-center justify-center p-2 rounded-full bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Secure In-App Purchase</h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Billed through your Apple ID. Manage or cancel anytime in iPhone Settings → Apple ID → Subscriptions.
            </p>
          </div>
        )}

        {/* iOS: products pending Apple review */}
        {isIOSNative && rc.ready && !rc.offering && (
          <div className="neo-card-subtle rounded-xl bg-card p-5 space-y-3 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">Subscriptions pending review</h3>
                <p className="text-xs text-muted-foreground mt-1 break-words">
                  Our subscription products are currently being reviewed by Apple. They'll be available shortly. Tap refresh to check again.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setLoading("refresh");
                try {
                  const result = await rc.refetchOfferings?.();
                  if (result) {
                    toast({ title: "Updated", description: "Subscriptions are now available." });
                  } else {
                    toast({
                      title: "Still pending",
                      description: "Products are not yet available. Please try again later.",
                    });
                  }
                } finally {
                  setLoading(null);
                }
              }}
              disabled={loading !== null}
              className="w-full"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading === "refresh" ? "animate-spin" : ""}`} />
              {loading === "refresh" ? "Checking..." : "Refresh"}
            </Button>
          </div>
        )}

        {/* Plan Cards */}
        <div className="grid md:grid-cols-2 gap-6">

            {PLANS.map((plan) => {
              const Icon = plan.icon;
              let pricing: { price: string; period: string };

              if (isIOSNative) {
                const targetId = plan.id === "yearly" ? "$rc_annual" : "$rc_monthly";
                const pkg =
                  rc.offering?.availablePackages.find((p: any) => p.identifier === targetId) ||
                  rc.offering?.availablePackages.find((p: any) =>
                    plan.id === "yearly" ? p.packageType === "ANNUAL" : p.packageType === "MONTHLY"
                  );
                pricing = {
                  price: pkg?.product?.priceString ?? plan.stripe.price,
                  period: plan.id === "yearly" ? "/year" : "/month",
                };
              } else {
                pricing = provider === "stripe" ? plan.stripe : plan.paystack;
              }

              return (
                <div
                  key={plan.id}
                  className={`relative neo-card-subtle rounded-xl bg-card p-6 flex flex-col gap-6 ${
                    plan.popular ? "border-primary" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 right-4">
                      <span className="neo-btn-subtle rounded-full bg-primary text-primary-foreground px-4 py-1 text-xs font-bold uppercase tracking-wide">
                        Popular
                      </span>
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">{pricing.price}</span>
                    <span className="text-muted-foreground text-lg">{pricing.period}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={loading !== null || (isIOSNative && !rc.ready)}
                    aria-label={`Start 7-day free trial for ${plan.name}`}
                    className="w-full rounded-full bg-success/90 py-2 px-4 text-center transition-all hover:bg-success active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span className="text-sm font-semibold text-white">
                      {loading === plan.id ? "Processing..." : "7 days free"}
                    </span>
                  </button>
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-2">
                    <Button
                      className="w-full neo-btn-subtle bg-foreground text-background hover:bg-foreground/90 font-semibold"
                      size="lg"
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loading !== null || (isIOSNative && !rc.ready)}
                    >
                      {loading === plan.id
                        ? "Processing..."
                        : isIOSNative && !rc.ready
                          ? "Loading..."
                          : "Start 7-Day Free Trial"}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      {isIOSNative ? "Cancel anytime in Settings" : "No credit card required • Cancel anytime"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        {/* Restore Purchases — required by Apple */}
        {isIOSNative && (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRestore}
              disabled={loading !== null}
              className="text-muted-foreground"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading === "restore" ? "animate-spin" : ""}`} />
              {loading === "restore" ? "Restoring..." : "Restore Purchases"}
            </Button>
          </div>
        )}

        {/* Apple-required subscription disclosures (iOS only) */}
        {isIOSNative && (
          <div className="neo-card-subtle rounded-xl bg-card p-5 space-y-3 text-xs text-muted-foreground leading-relaxed">
            <h3 className="text-sm font-semibold text-foreground">Subscription details</h3>
            <ul className="space-y-2 list-disc pl-4">
              <li>
                Your free 7-day trial converts to a paid subscription automatically. The Monthly Plan
                renews every 1 month and the Yearly Plan renews every 1 year at the price shown above.
              </li>
              <li>
                Payment is charged to your Apple ID account at confirmation of purchase, and at the end
                of the free trial period unless cancelled at least 24 hours before the end of the
                current period.
              </li>
              <li>
                Your subscription automatically renews unless auto-renew is turned off at least 24
                hours before the end of the current period. Your account will be charged for renewal
                within 24 hours prior to the end of the current period.
              </li>
              <li>
                You can manage and cancel your subscription at any time by going to your Apple ID
                Account Settings on your device after purchase.
              </li>
            </ul>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2 text-xs">
              <Link to="/terms" className="text-primary underline underline-offset-2 hover:text-primary/80">
                Terms of Use (EULA)
              </Link>
              <span aria-hidden="true">•</span>
              <Link to="/privacy" className="text-primary underline underline-offset-2 hover:text-primary/80">
                Privacy Policy
              </Link>
            </div>
          </div>
        )}

        {/* Test Payment - Only for admin */}
        {testEmail && (
          <div className="neo-card-subtle rounded-xl bg-card p-4 text-center space-y-3 border-dashed border-2 border-yellow-500/30">
            <div className="flex items-center justify-center gap-2 text-yellow-600 dark:text-yellow-400">
              <FlaskConical className="h-4 w-4" />
              <span className="text-sm font-semibold">Developer Test Mode</span>
            </div>
            <p className="text-xs text-muted-foreground">Activate 24h premium without payment (one-time test)</p>
            <Button
              variant="outline"
              className="border-yellow-500/50 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
              onClick={handleTestPayment}
              disabled={loading !== null}
            >
              {loading === "test" ? "Activating..." : "Activate Test Premium (24h)"}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Subscribe;
