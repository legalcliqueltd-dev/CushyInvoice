import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Settings, UserPlus, FileText, Send, CheckCircle2, Sparkles } from "lucide-react";

interface WelcomeTutorialProps {
  hasProfile?: boolean;
  hasClients?: boolean;
  hasInvoices?: boolean;
}

const STORAGE_KEY = "cushy_tutorial_dismissed";

export function WelcomeTutorial({ hasProfile = false, hasClients = false, hasInvoices = false }: WelcomeTutorialProps) {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === "true";
  });
  const navigate = useNavigate();

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  const steps = [
    {
      label: "Complete your company profile",
      description: "Add your logo, address & bank details",
      icon: Settings,
      done: hasProfile,
      action: () => navigate("/settings"),
    },
    {
      label: "Add your first client",
      description: "Save a client's name and email",
      icon: UserPlus,
      done: hasClients,
      action: () => navigate("/clients"),
    },
    {
      label: "Create your first invoice",
      description: "Add items, set a due date, done!",
      icon: FileText,
      done: hasInvoices,
      action: () => navigate("/invoices/new"),
    },
    {
      label: "Send it to your client",
      description: "Share via email or download PDF",
      icon: Send,
      done: false,
      action: () => navigate("/invoices"),
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Dismiss tutorial"
      >
        <X className="h-4 w-4" />
      </button>

      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-base">Welcome to CushyInvoice! 🎉</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Get started in 4 easy steps — your 7-day free trial is active.
        </p>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted mb-4 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>

        <div className="space-y-2">
          {steps.map((step, i) => (
            <button
              key={i}
              onClick={step.action}
              className="w-full flex items-center gap-3 p-3 rounded-lg text-left hover:bg-muted/50 transition-colors group"
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                step.done
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              } transition-colors`}>
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-medium ${step.done ? "line-through text-muted-foreground" : ""}`}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" className="text-xs" onClick={handleDismiss}>
            Skip tutorial
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
