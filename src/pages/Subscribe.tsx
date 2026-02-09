import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Zap, Star, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const PLANS = [
  {
    id: "monthly",
    name: "Monthly Plan",
    subtitle: "Perfect for freelancers",
    description: "7-day free trial, then $2.99/month",
    price: "$2.99",
    period: "/month",
    priceId: "price_1SSKe7RWxKms6a9XPEoka2SG",
    icon: Zap,
    features: [
      "7-day free trial",
      "Unlimited invoices",
      "Client management",
      "Payment tracking",
      "PDF export",
      "Email delivery",
      "Basic reporting",
    ],
  },
  {
    id: "yearly",
    name: "Yearly Plan",
    subtitle: "Best value for growing businesses",
    description: "7-day free trial, then $23.88/year (Save 33%)",
    price: "$23.88",
    period: "/year",
    priceId: "price_1SSKeIRWxKms6a9XncKq0Ixm",
    icon: Star,
    features: [
      "7-day free trial",
      "All Monthly features",
      "Priority support",
      "Advanced reporting",
      "Custom branding",
      "API access",
      "Save $11.88/year",
    ],
    popular: true,
  },
];

const Subscribe = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubscribe = async (priceId: string, planId: string) => {
    try {
      setLoading(planId);

      const { data, error } = await supabase.functions.invoke("create-subscription-session", {
        body: { priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-10">
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
              <span>Secure payments via Stripe</span>
            </div>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative neo-card-subtle rounded-xl bg-card p-6 flex flex-col gap-6 ${
                  plan.popular ? "border-primary" : ""
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3 right-4">
                    <span className="neo-btn-subtle rounded-full bg-primary text-primary-foreground px-4 py-1 text-xs font-bold uppercase tracking-wide">
                      Popular
                    </span>
                  </div>
                )}

                {/* Icon + Name */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">{plan.name}</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-lg">{plan.period}</span>
                </div>

                {/* Trial bar */}
                <div className="w-full rounded-full bg-success/90 py-2 px-4 text-center">
                  <span className="text-sm font-semibold text-white">7 days free</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="space-y-2">
                  <Button
                    className="w-full neo-btn-subtle bg-foreground text-background hover:bg-foreground/90 font-semibold"
                    size="lg"
                    onClick={() => handleSubscribe(plan.priceId, plan.id)}
                    disabled={loading !== null}
                  >
                    {loading === plan.id ? "Processing..." : "Start 7-Day Free Trial"}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    No credit card required • Cancel anytime
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Back link */}
        <div className="text-center">
          <Button variant="ghost" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Subscribe;
