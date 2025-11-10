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
    description: "Perfect for getting started",
    price: "$2.99",
    period: "/month",
    priceId: "price_1SRxiBDjurOQIWXOB9mPYt6n",
    features: [
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
    description: "Best value - Save 33%",
    price: "$23.88",
    period: "/year",
    priceId: "price_1SRxiTDjurOQIWXOiRxfdxhj",
    features: [
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="max-w-5xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground">
            Subscribe to CushyInvoice and start managing your invoices effortlessly
          </p>
          <p className="text-sm text-muted-foreground">Cancel anytime. Secure payments via Stripe.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular ? "border-primary shadow-lg scale-105" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Best Value
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-5xl font-bold">{plan.price}</span>
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
                  className="w-full"
                  size="lg"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.priceId, plan.id)}
                  disabled={loading !== null}
                >
                  {loading === plan.id ? "Loading..." : "Subscribe Now"}
                </Button>
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
