import { ReactNode } from "react";
import { Receipt, CheckCircle2, Shield, Zap, Globe } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

const features = [
  {
    icon: Zap,
    title: "Create invoices in seconds",
    description: "Professional templates ready to customize",
  },
  {
    icon: Globe,
    title: "Multi-currency support",
    description: "Invoice clients worldwide with ease",
  },
  {
    icon: Shield,
    title: "Secure & reliable",
    description: "Your data is encrypted and protected",
  },
  {
    icon: CheckCircle2,
    title: "Track payments",
    description: "Know when you get paid instantly",
  },
];

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left side - Brand & Features */}
      <div className="hidden lg:flex lg:w-[55%] auth-gradient landing-noise p-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Receipt className="h-7 w-7" />
            </div>
            <span className="text-2xl font-bold tracking-tight">CushyInvoice</span>
          </div>
        </div>
        
        <div className="relative z-10 space-y-8 max-w-lg">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
              Hassle-free invoicing for growing businesses
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              Create professional invoices, track payments, and manage your clients all in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="feature-card group hover:bg-white/15 transition-all duration-300 border-2 border-white/20 shadow-[3px_3px_0px_rgba(255,255,255,0.1)]"
              >
                <feature.icon className="h-6 w-6 mb-3 text-white/90 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                <p className="text-xs text-white/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-sm text-white/60">
          <span>© 2025 CushyInvoice</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[400px] space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Receipt className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">CushyInvoice</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">{title}</h2>
            <p className="text-muted-foreground mt-2 text-sm lg:text-base">{subtitle}</p>
          </div>

          {/* Form */}
          <div className="bg-card rounded-2xl border border-border p-6 lg:p-8 shadow-soft">
            {children}
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>GDPR Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
