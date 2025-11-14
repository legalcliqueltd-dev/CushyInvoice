import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const PLANS = [
  {
    id: "monthly",
    name: "Monthly Plan",
    description: "7-day free trial, then $2.99/month",
    price: "$2.99",
    localPrice: "₦1,500",
    period: "/month",
    priceId: "price_1SSKe7RWxKms6a9XPEoka2SG",
    paystackAmount: 1500,
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
    description: "7-day free trial, then $23.88/year (Save 33%)",
    price: "$23.88",
    localPrice: "₦12,000",
    period: "/year",
    priceId: "price_1SSKeIRWxKms6a9XncKq0Ixm",
    paystackAmount: 12000,
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
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paystack">("stripe");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubscribe = async (priceId: string, planId: string, paystackAmount: number) => {
    try {
      setLoading(planId);

      if (paymentMethod === "stripe") {
        const { data, error } = await supabase.functions.invoke("create-subscription-session", {
          body: { priceId },
        });

        if (error) throw error;

        if (data?.url) {
          window.open(data.url, "_blank");
        }
      } else {
        // Paystack payment
        const { data, error } = await supabase.functions.invoke("create-paystack-payment", {
          body: { 
            planId,
            amount: paystackAmount,
            currency: "NGN"
          },
        });

        if (error) throw error;

        if (data?.url) {
          window.open(data.url, "_blank");
        }
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
      <div className="max-w-6xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-block px-4 py-2 bg-primary/10 rounded-full mb-4">
            <span className="text-sm font-semibold text-primary">✨ Start Your Free Trial Today</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get 7 days free access to all premium features. No credit card required for trial.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              <span>Secure payments via Stripe & Paystack</span>
            </div>
          </div>
          
          {/* Payment Method Selection */}
          <div className="flex justify-center gap-4 pt-4">
            <button
              onClick={() => setPaymentMethod("stripe")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                paymentMethod === "stripe"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Pay with Stripe (USD)
            </button>
            <button
              onClick={() => setPaymentMethod("paystack")}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                paymentMethod === "paystack"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Pay with Paystack (NGN)
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative transition-all hover:scale-105 ${
                plan.popular 
                  ? "border-primary shadow-xl ring-2 ring-primary/20" 
                  : "hover:border-primary/50"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-1.5 rounded-full text-sm font-semibold shadow-lg">
                    ⭐ Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-bold">
                    {paymentMethod === "stripe" ? plan.price : plan.localPrice}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg"
                  size="lg"
                  onClick={() => handleSubscribe(plan.priceId, plan.id, plan.paystackAmount)}
                  disabled={loading !== null}
                >
                  {loading === plan.id ? "Processing..." : "Start 7-Day Free Trial"}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  No credit card required • Cancel anytime
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

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
